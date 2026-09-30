import assert from "node:assert/strict";
import test from "node:test";
import { GET as capabilities } from "../src/app/api/capabilities/route.ts";
import { POST as execute } from "../src/app/api/execute/route.ts";
import { getSandboxRegion, getToolchainSnapshotId, hasSandboxCredentials } from "../src/server/language-runtimes.ts";
import { EXECUTION_ENABLE_TOKEN, getExecutionPolicy } from "../src/server/execution-policy.ts";

function withExecutionLease() {
  const previousEnabled = process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  const previousExpiry = process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT;
  process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED = EXECUTION_ENABLE_TOKEN;
  process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT = new Date(Date.now() + 60_000).toISOString();
  return () => {
    if (previousEnabled === undefined) delete process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
    else process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED = previousEnabled;
    if (previousExpiry === undefined) delete process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT;
    else process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT = previousExpiry;
  };
}

test("Sandbox region defaults to the snapshot creation region", () => {
  const previous = process.env.AL2BEAT_SANDBOX_REGION;
  delete process.env.AL2BEAT_SANDBOX_REGION;
  assert.equal(getSandboxRegion(), "iad1");
  process.env.AL2BEAT_SANDBOX_REGION = "hnd1";
  assert.equal(getSandboxRegion(), "hnd1");
  process.env.AL2BEAT_SANDBOX_REGION = "unsupported";
  assert.equal(getSandboxRegion(), "iad1");
  if (previous === undefined) delete process.env.AL2BEAT_SANDBOX_REGION;
  else process.env.AL2BEAT_SANDBOX_REGION = previous;
});

test("capabilities가 Python 예제 실행과 제출 가능 여부를 분리해 표시한다", async () => {
  const previousEnabled = process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  delete process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  const response = await capabilities();
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.execution.enabled, false);
  assert.equal(body.execution.guard.code, "disabled");
  assert.deepEqual(Object.keys(body.execution.languages), ["c", "cpp", "java", "python", "csharp"]);
  for (const [language, status] of Object.entries(body.execution.languages) as Array<[string, { edit: boolean; run: boolean; judge: boolean }]>) {
    assert.equal(status.edit, true);
    assert.equal(status.run, language === "python");
    assert.equal(status.judge, false);
  }
  if (previousEnabled === undefined) delete process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  else process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED = previousEnabled;
});

test("execution policy requires an explicit lease and rejects expired or oversized leases", () => {
  const now = Date.parse("2026-09-30T00:00:00.000Z");
  const previousEnabled = process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  const previousExpiry = process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT;
  try {
    delete process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
    assert.equal(getExecutionPolicy(now).code, "disabled");
    process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED = EXECUTION_ENABLE_TOKEN;
    process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT = "2026-09-29T23:59:59.000Z";
    assert.equal(getExecutionPolicy(now).code, "expired");
    process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT = "2026-10-02T00:00:00.000Z";
    assert.equal(getExecutionPolicy(now).code, "lease-too-long");
    process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT = "2026-09-30T01:00:00.000Z";
    assert.equal(getExecutionPolicy(now).enabled, true);
  } finally {
    if (previousEnabled === undefined) delete process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
    else process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED = previousEnabled;
    if (previousExpiry === undefined) delete process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT;
    else process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT = previousExpiry;
  }
});

test("execute API blocks valid server requests before creating a Sandbox when the lease is closed", async () => {
  const previousEnabled = process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  delete process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  const response = await execute(new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "submit", problemId: "stack", language: "python", source: "print('YES')", input: "()", idempotencyKey: "guard-closed-00000000000001" }),
  }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "EXECUTION_GUARD_DISABLED");
  if (previousEnabled === undefined) delete process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED;
  else process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED = previousEnabled;
});

test("execute API가 잘못된 요청을 일관된 오류로 거부한다", async () => {
  const response = await execute(new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "run" }),
  }));
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "INVALID_REQUEST");
  assert.equal(typeof body.error.requestId, "string");
});

test("도구 모음 스냅샷이 없는 언어 요청은 Sandbox를 만들기 전에 거부한다", async () => {
  if (hasSandboxCredentials() && getToolchainSnapshotId()) return;
  const restore = withExecutionLease();
  const response = await execute(new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.44" },
    body: JSON.stringify({
      action: "run",
      problemId: "stack",
      language: "java",
      source: "class Main {}",
      input: "()",
      idempotencyKey: "test-key-0000000000000001",
    }),
  }));
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error.code, "SANDBOX_NOT_CONFIGURED");
  assert.equal(body.error.retryable, false);
  restore();
});

test("바이트 기준 소스 제한을 적용한다", async () => {
  const response = await execute(new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "run", problemId: "stack", language: "python", source: "가".repeat(10_000), input: "", idempotencyKey: "bytes-000000000000000000001" }),
  }));
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, "PAYLOAD_TOO_LARGE");
});

test("Sandbox 인증이 없는 환경에서는 비공개 제출을 시작하지 않는다", async () => {
  if (hasSandboxCredentials()) return;
  const restore = withExecutionLease();
  const response = await execute(new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.45" },
    body: JSON.stringify({
      action: "submit",
      problemId: "stack",
      language: "python",
      source: "print('YES')",
      input: "{[()]}",
      idempotencyKey: "sandbox-unavailable-0000000001",
    }),
  }));
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error.code, "SANDBOX_NOT_CONFIGURED");
  assert.equal(body.error.retryable, false);
  restore();
});
