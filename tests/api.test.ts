import assert from "node:assert/strict";
import test from "node:test";
import { GET as capabilities } from "../src/app/api/capabilities/route.ts";
import { POST as execute } from "../src/app/api/execute/route.ts";

test("capabilities가 Python만 실행·채점 가능으로 정확히 표시한다", async () => {
  const response = await capabilities();
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.execution.enabled, true);
  assert.deepEqual(Object.keys(body.execution.languages), ["c", "cpp", "java", "python", "csharp"]);
  for (const [language, status] of Object.entries(body.execution.languages) as Array<[string, { edit: boolean; run: boolean; judge: boolean }]>) {
    assert.equal(status.edit, true);
    assert.equal(status.run, language === "python");
    assert.equal(status.judge, language === "python");
  }
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

test("미검증 언어 요청은 Sandbox를 만들기 전에 거부한다", async () => {
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
  assert.equal(response.status, 422);
  assert.equal(body.error.code, "LANGUAGE_NOT_READY");
  assert.equal(body.error.retryable, false);
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
