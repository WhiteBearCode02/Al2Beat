export type LanguageId = "c" | "cpp" | "java" | "python" | "csharp";

export type Scene = {
  title: string;
  caption: string;
  visual: "stack" | "queue" | "hash" | "deque" | "linked-list" | "heap" | "search" | "merge" | "bfs" | "dfs" | "union-find" | "dp";
};

export type Concept = {
  id: string;
  title: string;
  english: string;
  category: string;
  status: "ready" | "coming";
  duration: number;
  summary: string;
  prerequisite: string[];
  checkpoints: string[];
  scenes: Scene[];
  transcript: string[];
  problem: {
    title: string;
    statement: string;
    input: string;
    output: string;
    constraints: string[];
    examples: { input: string; output: string; note: string }[];
    terms: string[];
  };
  templates: Record<LanguageId, string>;
};

export type GlossaryTerm = {
  id: string;
  ko: string;
  en: string;
  abbr?: string;
  aliases: string[];
  definition: string;
  example: string;
  when: string;
  mistake: string;
  related: string[];
};
