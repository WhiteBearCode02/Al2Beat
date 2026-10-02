import conceptsData from "../../content/concepts.json" with { type: "json" };
import glossaryData from "../../content/glossary.json" with { type: "json" };
import type { Concept, GlossaryTerm, LanguageId } from "@/types/content";

type PublicConcept = Omit<Concept, "templates">;

const slugs: Record<string, string> = {
  stack: "괄호 비트 맞추기",
  queue: "연습실 버퍼",
  "hash-map": "오늘의 최다 비트",
  deque: "양방향 셔틀",
  "linked-list": "커서 사이에 비트 넣기",
  "min-heap": "가장 가벼운 비트부터",
  "binary-search": "첫 임계 비트",
  "merge-sort": "입장 순서를 지키는 믹스",
  bfs: "최소 박자로 출구까지",
  dfs: "분리된 리듬 섬",
  "union-find": "같은 무대인지 확인하기",
  "basic-dp": "최소 에너지 트랙",
  "array-string": "리듬 문자열 압축",
  "prefix-sum": "구간 에너지 합",
  "two-pointers": "목표 합을 만드는 두 비트",
  "sliding-window": "가장 긴 콤보 구간",
  "recursion-backtracking": "가능한 리듬 패턴 만들기",
  greedy: "최소 코인으로 박자 맞추기",
  "binary-tree": "트랙 조명 트리의 높이",
  "binary-search-tree": "탐색 트리 튜닝 검사",
  dijkstra: "최단 비트 경로",
  "topological-sort": "공연 준비 순서",
  "knapsack-dp": "한정된 트랙 장비",
};

function starter(language: LanguageId, conceptId: string): string {
  const title = slugs[conceptId];
  const comments: Record<LanguageId, string> = {
    c: `// ${title}\n#include <stdio.h>\n\nint main(void) {\n    // TODO: 입력을 읽고 알고리즘을 구현하세요.\n    return 0;\n}\n`,
    cpp: `// ${title}\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    // TODO: 입력을 읽고 알고리즘을 구현하세요.\n    return 0;\n}\n`,
    java: `// ${title}\nimport java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // TODO: 입력을 읽고 알고리즘을 구현하세요.\n    }\n}\n`,
    python: `# ${title}\nimport sys\n\ndef solve() -> None:\n    # TODO: 입력을 읽고 알고리즘을 구현하세요.\n    pass\n\nif __name__ == "__main__":\n    solve()\n`,
    csharp: `// ${title}\nusing System;\nusing System.Collections.Generic;\n\npublic class Program\n{\n    public static void Main()\n    {\n        // TODO: 입력을 읽고 알고리즘을 구현하세요.\n    }\n}\n`,
  };
  return comments[language];
}

const languages: LanguageId[] = ["c", "cpp", "java", "python", "csharp"];

export const concepts: Concept[] = (conceptsData as PublicConcept[]).map((concept) => ({
  ...concept,
  templates: Object.fromEntries(
    languages.map((language) => [language, starter(language, concept.id)]),
  ) as Record<LanguageId, string>,
}));

export const glossary = glossaryData as GlossaryTerm[];

export const languageLabels: Record<LanguageId, string> = {
  c: "C",
  cpp: "C++",
  java: "Java",
  python: "Python",
  csharp: "C#",
};

export const monacoLanguages: Record<LanguageId, string> = {
  c: "c",
  cpp: "cpp",
  java: "java",
  python: "python",
  csharp: "csharp",
};
