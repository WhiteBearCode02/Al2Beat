"use client";

import dynamic from "next/dynamic";
import { Check, CircleAlert, CircleCheck, Download, Expand, Eye, FileCode2, FlaskConical, LoaderCircle, Minimize2, Orbit, Play, Send, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { languageLabels, monacoLanguages } from "@/lib/content";
import { getWorkspace, saveWorkspace } from "@/lib/storage";
import { runBrowserPython } from "@/lib/browser-python";
import type { Concept, LanguageId } from "@/types/content";
import { ReferenceSolutionPanel, SolutionConfirmation } from "./reference-solution-panel";

const CodeEditor = dynamic(() => import("./code-editor").then((module) => module.CodeEditor), {
  ssr: false,
  loading: () => <div className="editor-loading">Monaco 편집기를 불러오는 중…</div>,
});

const languages = Object.keys(languageLabels) as LanguageId[];
type LanguageCapability = { edit: boolean; run: boolean; judge: boolean; verifiedVersion: string | null; executionTarget: string };

type ExecutionResult = {
  status: "accepted" | "completed" | "wrong_answer" | "compile_error" | "runtime_error" | "time_limit" | "output_limit" | "system_error";
  label: string;
  action?: "run" | "submit";
  stdout?: string;
  stderr?: string;
  input?: string;
  expected?: string;
  durationMs?: number;
  passed?: number;
  total?: number;
  confirmed: string;
  requestId?: string;
};

export function IdePanel({ concept, focus, onFocusChange }: { concept: Concept; focus: boolean; onFocusChange: (value: boolean) => void }) {
  const [language, setLanguage] = useState<LanguageId>("python");
  const [code, setCode] = useState(concept.templates.python);
  const [customInput, setCustomInput] = useState(concept.problem.examples[0].input);
  const [inputMode, setInputMode] = useState<"example" | "custom">("example");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [resultTab, setResultTab] = useState<"result" | "guide">("result");
  const [running, setRunning] = useState<"run" | "submit" | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [solutionPromptFor, setSolutionPromptFor] = useState<string>();
  const [solutionVisibleFor, setSolutionVisibleFor] = useState<string>();
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionSource, setSolutionSource] = useState<string>();
  const [solutionError, setSolutionError] = useState<string>();
  const [capabilities, setCapabilities] = useState<Partial<Record<LanguageId, LanguageCapability>>>({
    python: { edit: true, run: true, judge: false, verifiedVersion: "Python 3.14 (Pyodide)", executionTarget: "browser-worker" },
  });

  useEffect(() => {
    let active = true;
    fetch("/api/capabilities", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { execution?: { languages?: Record<LanguageId, LanguageCapability> } }) => {
        if (active && body.execution?.languages) setCapabilities(body.execution.languages);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

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

  const execute = useCallback(async (action: "run" | "submit") => {
    const capability = capabilities[language];
    if (running || (action === "run" ? !capability?.run : !capability?.judge)) return;
    setRunning(action);
    setResultTab("result");
    setResult(null);
    try {
      const input = inputMode === "example" ? concept.problem.examples[0].input : customInput;
      if (action === "run") {
        const local = await runBrowserPython(code, input);
        const publicCase = inputMode === "example" ? concept.problem.examples[0] : undefined;
        const normalize = (value: string) => value.replace(/\r\n/g, "\n").trimEnd();
        const matches = local.status === "completed" && publicCase ? normalize(local.stdout) === normalize(publicCase.output) : null;
        const labels = {
          completed: matches === true ? "예제 통과" : matches === false ? "예제 불일치" : "실행 완료",
          compile_error: "구문 오류", runtime_error: "런타임 오류", time_limit: "시간 초과", output_limit: "출력 초과", system_error: "시스템 장애",
        } as const;
        const status = local.status === "completed" ? (matches === true ? "accepted" : matches === false ? "wrong_answer" : "completed") : local.status;
        const confirmed = local.status === "completed"
          ? matches === true ? "이 브라우저에서 실행한 공개 예제의 실제 출력이 기대 출력과 일치했습니다." : matches === false ? "이 브라우저에서 실행한 공개 예제의 실제 출력이 기대 출력과 다릅니다." : "이 브라우저에서 직접 입력을 정상 실행했습니다. 정답 여부는 판정하지 않습니다."
          : local.status === "time_limit" ? "이 브라우저의 Python 작업자를 3초 후 종료했습니다."
          : local.status === "output_limit" ? "실제 출력 또는 오류 출력이 64KB 제한을 넘었습니다."
          : local.status === "system_error" ? "브라우저 Python 런타임을 준비하지 못했습니다. 저장된 코드는 유지됩니다."
          : local.stderr || "실제 Python 실행 중 오류가 발생했습니다.";
        setResult({ status, label: labels[local.status], action: "run", stdout: local.stdout, stderr: local.stderr, input: publicCase?.input, expected: publicCase?.output, durationMs: local.durationMs, confirmed });
        return;
      }
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          problemId: concept.id,
          language,
          source: code,
          input,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = await response.json() as { ok: boolean; result?: ExecutionResult; error?: { message: string; requestId?: string } };
      if (!response.ok || !body.ok || !body.result) {
        setResult({
          status: "system_error",
          label: "시스템 장애",
          confirmed: body.error?.message ?? "실행 결과를 읽지 못했습니다. 저장된 코드는 그대로 유지됩니다.",
          requestId: body.error?.requestId,
        });
        return;
      }
      setResult(body.result);
    } catch {
      setResult({ status: "system_error", label: "연결 장애", confirmed: "실행 서버에 연결하지 못했습니다. 저장된 코드는 그대로 유지됩니다." });
    } finally {
      setRunning(null);
    }
  }, [capabilities, code, concept.id, concept.problem.examples, customInput, inputMode, language, running]);

  const selectedCapability = capabilities[language];
  const enabledServerLanguages = languages.filter((item) => capabilities[item]?.judge).length;
  const solutionContextKey = `${concept.id}:${language}`;
  const revealSolution = useCallback(async () => {
    const contextKey = `${concept.id}:${language}`;
    setSolutionPromptFor(undefined);
    setSolutionVisibleFor(contextKey);
    setSolutionLoading(true);
    setSolutionError(undefined);
    try {
      const response = await fetch(`/api/solutions/${encodeURIComponent(concept.id)}?language=${encodeURIComponent(language)}`);
      const body = await response.json() as { ok: boolean; solution?: { source: string }; error?: { message?: string } };
      if (!response.ok || !body.ok || !body.solution) throw new Error(body.error?.message ?? "기준 풀이를 불러오지 못했습니다.");
      setSolutionSource(body.solution.source);
    } catch (error) {
      setSolutionError(error instanceof Error ? error.message : "기준 풀이를 불러오지 못했습니다.");
    } finally {
      setSolutionLoading(false);
    }
  }, [concept.id, language]);

  return (
    <section className={`ide-panel panel ${focus ? "focus-mode" : ""}`} aria-labelledby="ide-heading">
      <header className="ide-header">
        <div className="ide-title"><FileCode2 size={18} /><div><p className="eyebrow">PRACTICE STUDIO</p><h2 id="ide-heading">코드로 다시 듣기</h2></div></div>
        <div className="ide-actions">
          <span className={`save-state ${saveState}`} aria-live="polite">
            {saveState === "saved" ? <Check size={14} /> : null}
            {saveState === "saved" ? "이 기기에 저장됨" : saveState === "saving" ? "저장 중…" : "저장 실패"}
          </span>
          <button className="icon-text-button solution-button" onClick={() => setSolutionPromptFor(solutionContextKey)}><Eye size={15} />정답 보기</button>
          <button className="icon-text-button" onClick={download}><Download size={15} />코드 다운로드</button>
          <button className="icon-button" onClick={() => onFocusChange(!focus)} aria-label={focus ? "집중 모드 종료" : "IDE 집중 모드"}>
            {focus ? <Minimize2 size={17} /> : <Expand size={17} />}
          </button>
        </div>
      </header>
      <div className="runtime-notice" role="status"><Orbit size={16} /><strong>다국어 실행</strong><span>Python 예제는 브라우저에서 실행 · {enabledServerLanguages === 5 ? "다섯 언어의 실행·제출 Sandbox 연결됨" : `서버 채점 ${enabledServerLanguages}/5 연결 · 도구 모음 스냅샷 연결 시 나머지 언어 활성화`}</span></div>
      <div className="ide-language-tabs" role="tablist" aria-label="프로그래밍 언어">
        {languages.map((item) => (
          <button key={item} role="tab" aria-selected={language === item} className={language === item ? "active" : ""} onClick={() => setLanguage(item)}>
            {languageLabels[item]}<small>{capabilities[item]?.judge ? "실행·채점 가능" : capabilities[item]?.run ? "예제 실행 가능" : "편집 가능"}</small>
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
            <button className="run-button" disabled={!selectedCapability?.run || running !== null} title={selectedCapability?.run ? language === "python" ? "현재 입력을 이 브라우저의 Python 작업자에서 실제 실행합니다." : "현재 입력을 네트워크 차단 Sandbox에서 컴파일·실행합니다." : "Vercel Sandbox 도구 모음 스냅샷을 연결하면 실행할 수 있습니다."} onClick={() => execute("run")}>
              {running === "run" ? <LoaderCircle className="spin" size={15} /> : <Play size={15} />}{running === "run" ? "실행 중" : "예제 실행"}
            </button>
            <button className="submit-button" disabled={!selectedCapability?.judge || running !== null} title={selectedCapability?.judge ? "네트워크 차단 Sandbox에서 서버 전용 테스트로 채점합니다." : "비공개 테스트 보호를 위해 검증된 Vercel Sandbox 연결 전에는 제출을 사용할 수 없습니다."} onClick={() => execute("submit")}>
              {running === "submit" ? <LoaderCircle className="spin" size={15} /> : <Send size={15} />}{running === "submit" ? "채점 중" : "제출"}
            </button>
          </div>
          <div className="result-box">
            <div className="io-tabs" role="tablist" aria-label="결과 정보">
              <button role="tab" aria-selected={resultTab === "result"} className={resultTab === "result" ? "active" : ""} onClick={() => setResultTab("result")}>결과</button>
              <button role="tab" aria-selected={resultTab === "guide"} className={resultTab === "guide" ? "active" : ""} onClick={() => setResultTab("guide")}>피드백 원칙</button>
            </div>
            {resultTab === "result" ? (
              result ? (
                <div className={`execution-result result-${result.status}`} aria-live="polite">
                  <div className="result-summary">
                    {result.status === "accepted" || result.status === "completed" ? <CircleCheck size={19} /> : <CircleAlert size={19} />}
                    <div><strong>{result.label}</strong>{typeof result.durationMs === "number" ? <span>{result.durationMs}ms</span> : null}</div>
                  </div>
                  <p className="confirmed-fact"><b>확인된 사실</b>{result.confirmed}</p>
                  {typeof result.passed === "number" ? <p className="test-progress">통과 {result.passed} / {result.total}</p> : null}
                  {result.input !== undefined ? <div className="result-stream"><span>입력</span><pre>{result.input}</pre></div> : null}
                  {result.expected !== undefined ? <div className="result-stream"><span>기대 출력</span><pre>{result.expected}</pre></div> : null}
                  {result.stdout !== undefined ? <div className="result-stream"><span>실제 출력</span><pre>{result.stdout || "(출력 없음)"}</pre></div> : null}
                  {result.stderr ? <div className="result-stream error-stream"><span>런타임 메시지</span><pre>{result.stderr}</pre></div> : null}
                  {result.requestId ? <small>요청 ID {result.requestId}</small> : null}
                </div>
              ) : (
                <div className="empty-result"><FlaskConical size={24} /><strong>실행 결과 없음</strong><p>Python에서 예제 실행 또는 제출을 누르세요. 코드는 실행 장애와 관계없이 자동 저장됩니다.</p></div>
              )
            ) : (
              <div className="feedback-guide"><p><b>확인된 사실</b> 컴파일러 메시지와 공개 테스트의 실제 차이만 표시합니다.</p><p><b>점검할 가능성</b> 근거가 제한된 추정은 정답 판정과 분리합니다.</p><p><ShieldAlert size={14} /> 유료 AI나 가짜 오류 줄 추정을 사용하지 않습니다.</p></div>
            )}
          </div>
        </aside>
      </div>
      {solutionVisibleFor === solutionContextKey ? <ReferenceSolutionPanel language={language} userCode={code} source={solutionSource} loading={solutionLoading} error={solutionError} onClose={() => setSolutionVisibleFor(undefined)} /> : null}
      {solutionPromptFor === solutionContextKey ? <SolutionConfirmation onCancel={() => setSolutionPromptFor(undefined)} onConfirm={revealSolution} /> : null}
    </section>
  );
}
