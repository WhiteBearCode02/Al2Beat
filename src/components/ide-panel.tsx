"use client";

import dynamic from "next/dynamic";
import { Check, CloudOff, Download, Expand, FileCode2, FlaskConical, Minimize2, Play, Send, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { languageLabels, monacoLanguages } from "@/lib/content";
import { getWorkspace, saveWorkspace } from "@/lib/storage";
import type { Concept, LanguageId } from "@/types/content";

const CodeEditor = dynamic(() => import("./code-editor").then((module) => module.CodeEditor), {
  ssr: false,
  loading: () => <div className="editor-loading">Monaco 편집기를 불러오는 중…</div>,
});

const languages = Object.keys(languageLabels) as LanguageId[];

export function IdePanel({ concept, focus, onFocusChange }: { concept: Concept; focus: boolean; onFocusChange: (value: boolean) => void }) {
  const [language, setLanguage] = useState<LanguageId>("python");
  const [code, setCode] = useState(concept.templates.python);
  const [customInput, setCustomInput] = useState(concept.problem.examples[0].input);
  const [inputMode, setInputMode] = useState<"example" | "custom">("example");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [resultTab, setResultTab] = useState<"result" | "guide">("result");

  useEffect(() => {
    let active = true;
    getWorkspace(concept.id, language).then((saved) => {
      if (!active) return;
      setCode(saved?.code ?? concept.templates[language]);
      setCustomInput(saved?.customInput ?? concept.problem.examples[0].input);
      setSaveState("saved");
    });
    return () => { active = false; };
  }, [concept, language]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveWorkspace({ conceptId: concept.id, language, code, customInput })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("error"));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [code, concept.id, customInput, language]);

  const download = useCallback(() => {
    const extensions: Record<LanguageId, string> = { c: "c", cpp: "cpp", java: "java", python: "py", csharp: "cs" };
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${concept.id}.${extensions[language]}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [code, concept.id, language]);

  return (
    <section className={`ide-panel panel ${focus ? "focus-mode" : ""}`} aria-labelledby="ide-heading">
      <header className="ide-header">
        <div className="ide-title"><FileCode2 size={18} /><div><p className="eyebrow">PRACTICE STUDIO</p><h2 id="ide-heading">코드로 다시 듣기</h2></div></div>
        <div className="ide-actions">
          <span className={`save-state ${saveState}`} aria-live="polite">
            {saveState === "saved" ? <Check size={14} /> : null}
            {saveState === "saved" ? "이 기기에 저장됨" : saveState === "saving" ? "저장 중…" : "저장 실패"}
          </span>
          <button className="icon-text-button" onClick={download}><Download size={15} />코드 다운로드</button>
          <button className="icon-button" onClick={() => onFocusChange(!focus)} aria-label={focus ? "집중 모드 종료" : "IDE 집중 모드"}>
            {focus ? <Minimize2 size={17} /> : <Expand size={17} />}
          </button>
        </div>
      </header>
      <div className="runtime-notice" role="status"><CloudOff size={16} /><strong>안전 모드</strong><span>5개 언어 모두 편집 가능 · 격리 실행 실측 전이라 실행/채점은 비활성화</span></div>
      <div className="ide-language-tabs" role="tablist" aria-label="프로그래밍 언어">
        {languages.map((item) => (
          <button key={item} role="tab" aria-selected={language === item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)}>
            {languageLabels[item]}<small>편집 가능</small>
          </button>
        ))}
      </div>
      <div className="ide-workspace">
        <div className="editor-wrap"><CodeEditor language={monacoLanguages[language]} value={code} onChange={(value) => { setSaveState("saving"); setCode(value); }} /></div>
        <aside className="io-panel">
          <div className="io-tabs" role="tablist" aria-label="실행 입력 선택">
            <button role="tab" aria-selected={inputMode === "example"} className={inputMode === "example" ? "active" : ""} onClick={() => setInputMode("example")}>공개 예제</button>
            <button role="tab" aria-selected={inputMode === "custom"} className={inputMode === "custom" ? "active" : ""} onClick={() => setInputMode("custom")}>직접 입력</button>
          </div>
          {inputMode === "example" ? <pre className="io-content">{concept.problem.examples[0].input}</pre> : (
            <textarea value={customInput} maxLength={10_000} onChange={(event) => { setSaveState("saving"); setCustomInput(event.target.value); }} aria-label="사용자 입력" />
          )}
          <div className="run-buttons">
            <button disabled title="Vercel Sandbox의 다섯 언어 실측과 운영 한도 검증이 필요합니다."><Play size={15} />예제 실행</button>
            <button disabled title="서버 전용 테스트는 Sandbox 검증 후에만 채점합니다."><Send size={15} />제출</button>
          </div>
          <div className="result-box">
            <div className="io-tabs" role="tablist" aria-label="결과 정보">
              <button role="tab" aria-selected={resultTab === "result"} className={resultTab === "result" ? "active" : ""} onClick={() => setResultTab("result")}>결과</button>
              <button role="tab" aria-selected={resultTab === "guide"} className={resultTab === "guide" ? "active" : ""} onClick={() => setResultTab("guide")}>피드백 원칙</button>
            </div>
            {resultTab === "result" ? (
              <div className="empty-result"><FlaskConical size={24} /><strong>실행 결과 없음</strong><p>코드는 자동 저장됩니다. 실행 기능이 없어도 언제든 내려받을 수 있습니다.</p></div>
            ) : (
              <div className="feedback-guide"><p><b>확인된 사실</b> 컴파일러 메시지와 공개 테스트의 실제 차이만 표시합니다.</p><p><b>점검할 가능성</b> 근거가 제한된 추정은 정답 판정과 분리합니다.</p><p><ShieldAlert size={14} /> 유료 AI나 가짜 오류 줄 추정을 사용하지 않습니다.</p></div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
