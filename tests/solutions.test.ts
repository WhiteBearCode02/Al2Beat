import assert from "node:assert/strict";
import test from "node:test";
import { GET as getSolution } from "../src/app/api/solutions/[conceptId]/route.ts";
import { getReferenceSolution } from "../src/server/reference-solutions.ts";

const conceptIds = ["stack", "queue", "hash-map", "binary-search", "merge-sort", "bfs", "dfs", "basic-dp"];

test("8개 문제에 Python과 C++ 기준 풀이가 있다", () => {
  for (const conceptId of conceptIds) {
    for (const language of ["python", "cpp"] as const) {
      const source = getReferenceSolution(conceptId, language);
      assert.ok(source && source.length > 40, `${conceptId}/${language} solution missing`);
    }
  }
});

test("기준 풀이 API가 요청 언어의 코드만 반환한다", async () => {
  const response = await getSolution(new Request("http://localhost/api/solutions/stack?language=python"), {
    params: Promise.resolve({ conceptId: "stack" }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.solution.language, "python");
  assert.equal(typeof body.solution.source, "string");
  assert.equal(body.solution.source.includes("privateTests"), false);
});

test("준비되지 않은 언어는 명시적인 상태로 응답한다", async () => {
  const response = await getSolution(new Request("http://localhost/api/solutions/stack?language=java"), {
    params: Promise.resolve({ conceptId: "stack" }),
  });
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error.code, "SOLUTION_NOT_READY");
});
