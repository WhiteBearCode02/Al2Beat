"use client";

import { Check, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { languageLabels } from "@/lib/content";
import type { LanguageId } from "@/types/content";

export function SolutionConfirmation({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onCancel]);

  return (
    <div className="dialog-backdrop solution-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section className="solution-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="solution-confirm-title" aria-describedby="solution-confirm-description">
        <button className="icon-button solution-close" onClick={onCancel} aria-label="정답 보기 취소"><X size={17} /></button>
        <p className="eyebrow">REFERENCE ANSWER</p>
        <h2 id="solution-confirm-title">정답을 확인할까요?</h2>
        <p id="solution-confirm-description">많은 고민 후 스스로 정말 풀 수 없을 때 확인하십시오.</p>
        <div className="solution-confirm-actions">
          <button className="icon-text-button" onClick={onCancel}>계속 풀기</button>
          <button className="submit-button" onClick={onConfirm} autoFocus><Check size={15} />확인</button>
        </div>
      </section>
    </div>
  );
}

export function ReferenceSolutionPanel({ language, userCode, source, loading, error, onClose }: {
  language: LanguageId;
  userCode: string;
  source?: string;
  loading: boolean;
  error?: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!source) return;
    await navigator.clipboard.writeText(source);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <section className="solution-panel" aria-labelledby="solution-heading">
      <header>
        <div><p className="eyebrow">REFERENCE SOLUTION · {languageLabels[language]}</p><h3 id="solution-heading">내 코드와 기준 풀이 비교</h3></div>
        <div className="solution-panel-actions">
          <button className="icon-text-button" onClick={copy} disabled={!source}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "복사됨" : "정답 복사"}</button>
          <button className="icon-button" onClick={onClose} aria-label="정답 비교 닫기"><X size={17} /></button>
        </div>
      </header>
      {loading ? <p className="solution-state" role="status">기준 풀이를 불러오는 중…</p> : error ? <p className="solution-state solution-error" role="alert">{error}</p> : (
        <div className="solution-compare">
          <div><strong>내 코드</strong><pre><code>{userCode}</code></pre></div>
          <div><strong>기준 풀이</strong><pre><code>{source}</code></pre></div>
        </div>
      )}
      <p className="solution-note">기준 풀이는 가능한 한 가지 방법입니다. 그대로 외우기보다 상태와 시간 복잡도를 자신의 코드와 비교해 보세요.</p>
    </section>
  );
}
