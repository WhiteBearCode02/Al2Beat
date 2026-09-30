import { PROBLEM_IDS, type ProblemId } from "../../lib/problem-ids.ts";

export const SOLUTION_CONCEPT_IDS = PROBLEM_IDS;
export type SolutionConceptId = ProblemId;
export type ReferenceSolutionSet = Record<SolutionConceptId, string>;
