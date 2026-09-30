import "server-only";

import type { LanguageId } from "@/types/content";
import { cSolutions } from "./reference-solutions/c.ts";
import { cppSolutions } from "./reference-solutions/cpp.ts";
import { csharpSolutions } from "./reference-solutions/csharp.ts";
import { javaSolutions } from "./reference-solutions/java.ts";
import { pythonSolutions } from "./reference-solutions/python.ts";
import type { ReferenceSolutionSet, SolutionConceptId } from "./reference-solutions/types.ts";

export type { SolutionConceptId } from "./reference-solutions/types.ts";

const solutions: Record<LanguageId, ReferenceSolutionSet> = {
  c: cSolutions,
  cpp: cppSolutions,
  java: javaSolutions,
  python: pythonSolutions,
  csharp: csharpSolutions,
};

export function getReferenceSolution(conceptId: string, language: LanguageId) {
  return solutions[language][conceptId as SolutionConceptId]?.trim();
}

export function hasReferenceSolution(conceptId: string, language: LanguageId) {
  return Boolean(getReferenceSolution(conceptId, language));
}
