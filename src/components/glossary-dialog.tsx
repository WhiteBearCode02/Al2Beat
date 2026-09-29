"use client";

import { BookOpen, Search, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { GlossaryTerm } from "@/types/content";

export function GlossaryDialog({ terms, selectedId, open, onClose, onSelect }: { terms: GlossaryTerm[]; selectedId: string | null; open: boolean; onClose: () => void; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.toLocaleLowerCase("ko"));
  const closeRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => terms.filter((term) => [term.ko, term.en, term.abbr ?? "", ...term.aliases].join(" ").toLocaleLowerCase("ko").includes(deferred)), [deferred, terms]);
  const requested = terms.find((term) => term.id === selectedId);
  const selected = requested && filtered.some((term) => term.id === requested.id) ? requested : filtered[0];

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="glossary-dialog" role="dialog" aria-modal="true" aria-labelledby="glossary-title" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
        <header><div><p className="eyebrow">AL2BEAT DICTIONARY</p><h2 id="glossary-title">개발자 용어 사전 <span>{terms.length}</span></h2></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="용어 사전 닫기"><X size={18} /></button></header>
        <div className="glossary-layout">
          <aside>
            <label className="search-box"><Search size={16} /><span className="sr-only">용어 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="한글 · English · 약어" autoFocus /></label>
            <p className="search-count">{filtered.length}개 찾음</p>
            <div className="term-list">
              {filtered.map((term) => <button key={term.id} className={selected?.id === term.id ? "active" : ""} onClick={() => onSelect(term.id)}><span>{term.ko}</span><small>{term.en}{term.abbr ? ` · ${term.abbr}` : ""}</small></button>)}
              {filtered.length === 0 ? <p className="no-terms">일치하는 용어가 없습니다.</p> : null}
            </div>
          </aside>
          {selected ? <article className="term-detail">
            <div className="term-heading"><BookOpen size={22} /><div><h3>{selected.ko}</h3><p>{selected.en}{selected.abbr ? ` · ${selected.abbr}` : ""}</p></div></div>
            <p className="term-definition">{selected.definition}</p>
            <dl><div><dt>쉬운 예시</dt><dd>{selected.example}</dd></div><div><dt>언제 쓰나요</dt><dd>{selected.when}</dd></div><div><dt>흔한 실수</dt><dd>{selected.mistake}</dd></div><div><dt>같이 찾기</dt><dd>{selected.aliases.join(" · ")}</dd></div></dl>
            <div className="related-problems"><span>관련 트랙</span>{selected.related.length ? selected.related.map((item) => <code key={item}>{item}</code>) : <em>공통 개념</em>}</div>
          </article> : null}
        </div>
      </section>
    </div>
  );
}
