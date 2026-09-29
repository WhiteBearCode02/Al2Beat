import assert from "node:assert/strict";
import test from "node:test";
import { GET as capabilities } from "../src/app/api/capabilities/route.ts";
import { POST as execute } from "../src/app/api/execute/route.ts";

test("capabilities가 다섯 언어를 편집 전용으로 정확히 표시한다", async () => {
  const response = await capabilities();
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.execution.enabled, false);
  assert.deepEqual(Object.keys(body.execution.languages), ["c", "cpp", "java", "python", "csharp"]);
  for (const status of Object.values(body.execution.languages) as Array<{ edit: boolean; run: boolean; judge: boolean }>) {
    assert.equal(status.edit, true);
    assert.equal(status.run, false);
    assert.equal(status.judge, false);
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

test("유효 요청도 검증 전에는 실행하지 않고 503으로 중지한다", async () => {
  const response = await execute(new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.44" },
    body: JSON.stringify({
      action: "run",
      problemId: "stack",
      language: "python",
      source: "print(42)",
      input: "()",
      idempotencyKey: "test-key-0000000000000001",
    }),
  }));
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.error.code, "EXECUTION_DISABLED");
  assert.equal(body.error.retryable, true);
});

test("동일 idempotency key를 중복 처리하지 않는다", async () => {
  const make = () => new Request("http://localhost/api/execute", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.45" },
    body: JSON.stringify({ action: "submit", problemId: "bfs", language: "java", source: "class Main {}", input: "", idempotencyKey: "duplicate-0000000000000001" }),
  });
  assert.equal((await execute(make())).status, 503);
  const duplicate = await execute(make());
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).error.code, "DUPLICATE_REQUEST");
});
