export const SOLUTION_CONCEPT_IDS = [
  "stack",
  "queue",
  "hash-map",
  "binary-search",
  "merge-sort",
  "bfs",
  "dfs",
  "basic-dp",
] as const;

export type SolutionConceptId = (typeof SOLUTION_CONCEPT_IDS)[number];
export type ReferenceSolutionSet = Record<SolutionConceptId, string>;
