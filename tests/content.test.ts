import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { PROBLEM_IDS } from "../src/lib/problem-ids.ts";

type Concept = { id: string; status: string; duration: number; scenes: unknown[]; transcript: string[]; problem: { examples: unknown[]; terms: string[] } };
type Term = { id: string; ko: string; en: string; definition: string; example: string; when: string; mistake: string; related: string[] };

const concepts = JSON.parse(readFileSync("content/concepts.json", "utf8")) as Concept[];
const terms = JSON.parse(readFileSync("content/glossary.json", "utf8")) as Term[];

test("12개 콘텐츠가 영상·대본·문제·용어 연결을 갖춘다", () => {
  assert.equal(concepts.length, 12);
  assert.equal(new Set(concepts.map((item) => item.id)).size, 12);
  assert.deepEqual(new Set(concepts.map((item) => item.id)), new Set(PROBLEM_IDS));
  const termIds = new Set(terms.map((item) => item.id));
  for (const concept of concepts) {
    assert.equal(concept.status, "ready");
    assert.ok(concept.duration >= 30 && concept.duration <= 90);
    assert.equal(concept.scenes.length, 6);
    assert.equal(concept.transcript.length, 6);
    assert.ok(concept.problem.examples.length >= 1);
    assert.ok(concept.problem.terms.length >= 5);
    for (const term of concept.problem.terms) assert.ok(termIds.has(term), `${concept.id}/${term} glossary term missing`);
  }
});

test("용어 40개 이상이 필수 설명 필드를 가진다", () => {
  assert.ok(terms.length >= 40);
  assert.equal(new Set(terms.map((item) => item.id)).size, terms.length);
  for (const term of terms) {
    assert.ok(term.ko && term.en && term.definition && term.example && term.when && term.mistake);
    assert.ok(Array.isArray(term.related));
  }
});

test("서버 전용 테스트를 클라이언트 컴포넌트가 가져오지 않는다", () => {
  const files = readdirSync("src/components").filter((name) => name.endsWith(".tsx"));
  for (const file of files) {
    const source = readFileSync(join("src/components", file), "utf8");
    assert.equal(source.includes("private-tests"), false, `${file} leaked a server-only import`);
  }
});
