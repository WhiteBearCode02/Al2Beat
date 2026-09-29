"use client";

import { BookOpenText, ChevronRight } from "lucide-react";
import type { Concept, GlossaryTerm } from "@/types/content";

export function ProblemPanel({ concept, terms, onTerm }: { concept: Concept; terms: GlossaryTerm[]; onTerm: (id: string) => void }) {
  const related = concept.problem.terms.map((id) => terms.find((term) => term.id === id)).filter(Boolean) as GlossaryTerm[];
  return (
    <section className="problem-card panel" aria-labelledby="problem-heading">
      <header className="panel-header">
        <div><p className="eyebrow">CHECKPOINT PROBLEM</p><h2 id="problem-heading">{concept.problem.title}</h2></div>
        <span className="level-badge">기초</span>
      </header>
      <p className="problem-statement">{concept.problem.statement}</p>
      <div className="problem-spec">
        <div><h3>입력</h3><p>{concept.problem.input}</p></div>
        <div><h3>출력</h3><p>{concept.problem.output}</p></div>
      </div>
      <div className="constraints">
        <h3>제한</h3>
        <ul>{concept.problem.constraints.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="example-block">
        <div><span>예제 입력 1</span><pre>{concept.problem.examples[0].input}</pre></div>
        <div><span>예제 출력 1</span><pre>{concept.problem.examples[0].output}</pre></div>
      </div>
      <p className="example-note">{concept.problem.examples[0].note}</p>
      <div className="term-row" role="group" aria-label="관련 용어">
        <BookOpenText size={16} />
        {related.map((term) => (
          <button key={term.id} onClick={() => onTerm(term.id)}>{term.ko}<ChevronRight size={12} /></button>
        ))}
      </div>
    </section>
  );
}
