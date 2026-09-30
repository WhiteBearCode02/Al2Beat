export const PROBLEM_IDS = [
  "stack",
  "queue",
  "hash-map",
  "deque",
  "linked-list",
  "min-heap",
  "binary-search",
  "merge-sort",
  "bfs",
  "dfs",
  "union-find",
  "basic-dp",
] as const;

export type ProblemId = (typeof PROBLEM_IDS)[number];
