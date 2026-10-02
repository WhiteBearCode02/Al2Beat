import assert from "node:assert/strict";
import test from "node:test";
import { GET as getSolution } from "../src/app/api/solutions/[conceptId]/route.ts";
import { PROBLEM_IDS } from "../src/lib/problem-ids.ts";
import { getReferenceSolution } from "../src/server/reference-solutions.ts";
import type { LanguageId } from "../src/types/content.ts";

const conceptIds = PROBLEM_IDS;
const languages: LanguageId[] = ["c", "cpp", "java", "python", "csharp"];

test("23개 문제에 다섯 언어 기준 풀이가 모두 있다", () => {
  for (const conceptId of conceptIds) {
    for (const language of languages) {
      const source = getReferenceSolution(conceptId, language);
      assert.ok(source && source.length > 40, `${conceptId}/${language} solution missing`);
      assert.ok(Buffer.byteLength(source, "utf8") <= 20_000, `${conceptId}/${language} exceeds source limit`);
      assert.equal(source.includes("privateTests"), false);
    }
  }
});

test("기준 풀이 API가 23개 문제의 다섯 언어 코드를 반환한다", async () => {
  for (const conceptId of conceptIds) {
    for (const language of languages) {
      const response = await getSolution(new Request(`http://localhost/api/solutions/${conceptId}?language=${language}`), {
        params: Promise.resolve({ conceptId }),
      });
      const body = await response.json();
      assert.equal(response.status, 200);
      assert.equal(body.ok, true);
      assert.equal(body.solution.conceptId, conceptId);
      assert.equal(body.solution.language, language);
      assert.equal(typeof body.solution.source, "string");
      assert.equal(body.solution.source.includes("privateTests"), false);
    }
  }
});

test("지원하지 않는 언어는 입력 오류로 거부한다", async () => {
  const response = await getSolution(new Request("http://localhost/api/solutions/stack?language=javascript"), {
    params: Promise.resolve({ conceptId: "stack" }),
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_REQUEST");
});
