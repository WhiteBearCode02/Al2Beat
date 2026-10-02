"use client";

import { Bookmark, BookOpenText, Check, ChevronDown, ChevronRight, Database, Download, Headphones, Info, PanelLeftClose, PanelLeftOpen, Search, Settings2, Sparkles, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlossaryDialog } from "./glossary-dialog";
import { IdePanel } from "./ide-panel";
import { MotionLesson } from "./motion-lesson";
import { ProblemPanel } from "./problem-panel";
import { ReviewPlanner } from "./review-planner";
import { DEFAULT_REVIEW_INTERVAL_DAYS, scheduleReview } from "@/lib/review";
import { exportBackup, getAllProgress, importBackup, saveProgress, type ProgressState, type SavedProgress } from "@/lib/storage";
import type { Concept, GlossaryTerm } from "@/types/content";

const categoryOrder = ["자료구조", "탐색·정렬", "그래프", "문제 해결 전략", "DP"];

export function LearningStudio({ concepts, glossary }: { concepts: Concept[]; glossary: GlossaryTerm[] }) {
  const [selectedId, setSelectedId] = useState(concepts[0].id);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [focus, setFocus] = useState(false);
  const [panelSize, setPanelSize] = useState(2);
  const [mobileTab, setMobileTab] = useState<"video" | "problem" | "terms">("video");
  const [progress, setProgress] = useState<Record<string, SavedProgress>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [storageMessage, setStorageMessage] = useState("브라우저에 자동 저장");
  const progressRef = useRef<Record<string, SavedProgress>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const selected = concepts.find((concept) => concept.id === selectedId) ?? concepts[0];

  useEffect(() => {
    getAllProgress()
      .then((items) => {
        const savedProgress = Object.fromEntries(items.map((item) => [item.conceptId, item]));
        progressRef.current = savedProgress;
        setProgress(savedProgress);
      })
      .catch((error: unknown) => {
        setStorageMessage(error instanceof Error ? error.message : "저장된 기록을 불러오지 못했습니다.");
      })
      .finally(() => setProgressLoaded(true));
    const frame = window.requestAnimationFrame(() => setSidebarOpen(window.innerWidth > 1100));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const groups = useMemo(() => {
    const normalized = query.toLocaleLowerCase("ko");
    return categoryOrder.map((category) => ({
      category,
      items: concepts.filter((concept) => concept.category === category && [concept.title, concept.english, concept.summary].join(" ").toLocaleLowerCase("ko").includes(normalized)),
    }));
  }, [concepts, query]);

  const updateProgress = useCallback(async (conceptId: string, updates: Partial<Omit<SavedProgress, "conceptId" | "updatedAt">>) => {
    const previous = progressRef.current[conceptId] ?? { conceptId, state: "not-started" as ProgressState, bookmarked: false, watchedScene: 0, updatedAt: new Date().toISOString() };
    const next = { ...previous, ...updates, updatedAt: new Date().toISOString() };
    const nextProgress = { ...progressRef.current, [conceptId]: next };
    progressRef.current = nextProgress;
    setProgress(nextProgress);

    try {
      await saveProgress(next);
      setStorageMessage("브라우저에 저장됨");
      return true;
    } catch (error) {
      setStorageMessage(error instanceof Error ? `저장 실패 · ${error.message}` : "브라우저 저장 실패");
      return false;
    }
  }, []);

  const onScene = useCallback((scene: number) => {
    if (!progressLoaded) return;
    const current = progress[selectedId];
    if (!current || scene > current.watchedScene || current.state === "not-started") {
      void updateProgress(selectedId, { watchedScene: Math.max(scene, current?.watchedScene ?? 0), state: current?.state === "complete" ? "complete" : "learning" });
    }
  }, [progress, progressLoaded, selectedId, updateProgress]);

  const recordPracticeIssue = useCallback((issue: { summary: string }) => {
    const current = progress[selectedId];
    void updateProgress(selectedId, {
      state: "review",
      lastWrongAt: new Date().toISOString(),
      lastWrongSummary: issue.summary.slice(0, 500),
      reviewIntervalDays: current?.reviewIntervalDays ?? DEFAULT_REVIEW_INTERVAL_DAYS,
      nextReviewAt: current?.nextReviewAt ?? scheduleReview(current?.reviewIntervalDays ?? DEFAULT_REVIEW_INTERVAL_DAYS),
    });
  }, [progress, selectedId, updateProgress]);

  const openTerm = (id: string) => {
    setSelectedTerm(id);
    setGlossaryOpen(true);
  };

  const downloadBackup = async () => {
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `al2beat-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStorageMessage("JSON 백업 완료");
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : "백업 실패");
    }
  };

  const restoreBackup = async (file: File) => {
    try {
      if (file.size > 2_000_000) throw new Error("백업 파일은 2MB 이하여야 합니다.");
      await importBackup(JSON.parse(await file.text()) as unknown);
      setStorageMessage("복구 완료 · 화면을 새로고침합니다");
      window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setStorageMessage(error instanceof Error ? error.message : "복구 실패");
    }
  };

  const completionCount = Object.values(progress).filter((item) => item.state === "complete").length;

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-closed"} ${focus ? "ide-focused" : ""}`} style={{ "--panel-size": panelSize } as React.CSSProperties}>
      <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
      <header className="topbar">
        <div className="brand-cluster">
          <button className="icon-button sidebar-toggle" onClick={() => setSidebarOpen((value) => !value)} aria-label={sidebarOpen ? "트랙 목록 닫기" : "트랙 목록 열기"}>
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div className="brand"><strong>Al2Beat</strong><span>LEARN THE LOGIC. FEEL THE FLOW.</span></div>
        </div>
        <div className="topbar-meta">
          <label className="panel-size-control"><Settings2 size={15} /><span>화면 크기</span><input type="range" min="1" max="3" step="1" value={panelSize} onChange={(event) => setPanelSize(Number(event.target.value))} /></label>
          <button className="dictionary-button" onClick={() => setGlossaryOpen(true)}><BookOpenText size={16} />용어 사전 <span>{glossary.length}</span></button>
          <div className="storage-menu">
            <span><Database size={14} />{storageMessage}</span>
            <button onClick={downloadBackup} title="JSON 백업"><Download size={15} /><span className="sr-only">JSON 백업</span></button>
            <button onClick={() => fileRef.current?.click()} title="JSON 복구"><Upload size={15} /><span className="sr-only">JSON 복구</span></button>
            <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void restoreBackup(file); }} />
          </div>
        </div>
      </header>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="학습 트랙 탐색">
        <div className="sidebar-heading"><div><p className="eyebrow">MY TRACK</p><h2>알고리즘 트랙</h2></div><span>{completionCount}/{concepts.length}</span></div>
        <label className="search-box"><Search size={16} /><span className="sr-only">개념 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="개념 검색" /></label>
        <nav className="track-nav">
          {groups.map((group) => (
            <section key={group.category}>
              <h3><ChevronDown size={14} />{group.category}<span>{group.items.length}</span></h3>
              {group.items.map((concept) => {
                const itemProgress = progress[concept.id];
                return <button key={concept.id} className={selected.id === concept.id ? "active" : ""} onClick={() => { setSelectedId(concept.id); if (window.innerWidth <= 1100) setSidebarOpen(false); }}>
                  <span className={`track-dot ${itemProgress?.state ?? "not-started"}`}>{itemProgress?.state === "complete" ? <Check size={11} /> : null}</span>
                  <span><b>{concept.title}</b><small>{concept.english}</small></span>
                  <ChevronRight size={14} />
                </button>;
              })}
            </section>
          ))}
        </nav>
        <div className="sidebar-note"><Info size={15} /><p>기록은 이 브라우저의 IndexedDB에만 저장됩니다. 데이터를 지우거나 기기를 바꾸면 사라질 수 있으니 JSON으로 백업하세요.</p></div>
      </aside>

      <main id="main-content" className="main-content">
        <section className="track-hero">
          <div className="track-copy">
            <div className="track-kicker"><span>{selected.category}</span><ChevronRight size={13} /><span>{selected.english}</span></div>
            <h1>{selected.title}<em>{selected.summary}</em></h1>
          </div>
          <div className="hero-actions">
            <button className={`bookmark-button ${progress[selected.id]?.bookmarked ? "active" : ""}`} onClick={() => void updateProgress(selected.id, { bookmarked: !progress[selected.id]?.bookmarked })} aria-pressed={progress[selected.id]?.bookmarked ?? false}><Bookmark size={16} />북마크</button>
            <button className="complete-button" onClick={() => void updateProgress(selected.id, { state: progress[selected.id]?.state === "complete" ? "review" : "complete" })}><Check size={16} />{progress[selected.id]?.state === "complete" ? "복습으로 전환" : "학습 완료"}</button>
          </div>
        </section>

        <section className="checkpoint-strip" aria-label="학습 체크포인트">
          <div className="checkpoint-line" />
          {selected.checkpoints.map((item, index) => {
            const reached = index <= (progress[selected.id]?.watchedScene ?? -1);
            return <div key={item} className={reached ? "reached" : ""}><span>{reached ? <Check size={12} /> : index + 1}</span><small>{item}</small></div>;
          })}
        </section>

        <div className="mobile-tabs" role="tablist" aria-label="모바일 학습 화면">
          <button role="tab" aria-selected={mobileTab === "video"} onClick={() => setMobileTab("video")}><Headphones size={15} />영상</button>
          <button role="tab" aria-selected={mobileTab === "problem"} onClick={() => setMobileTab("problem")}><Sparkles size={15} />문제</button>
          <button role="tab" aria-selected={mobileTab === "terms"} onClick={() => setMobileTab("terms")}><BookOpenText size={15} />용어</button>
        </div>

        <div className={`learning-grid mobile-${mobileTab}`}>
          <MotionLesson key={selected.id} concept={selected} onScene={onScene} />
          <ProblemPanel concept={selected} terms={glossary} onTerm={openTerm} />
          <section className="mobile-terms-panel panel" aria-label="관련 용어">
            <header className="panel-header"><div><p className="eyebrow">QUICK GLOSSARY</p><h2>이번 트랙의 용어</h2></div></header>
            {selected.problem.terms.map((id) => { const term = glossary.find((item) => item.id === id); return term ? <button key={id} onClick={() => openTerm(id)}><b>{term.ko}</b><span>{term.definition}</span><ChevronRight size={14} /></button> : null; })}
          </section>
        </div>

        <ReviewPlanner key={`${selected.id}:${progressLoaded ? "ready" : "loading"}`} progress={progress[selected.id]} onChange={(updates) => updateProgress(selected.id, updates)} />
        <IdePanel
          concept={selected}
          focus={focus}
          onFocusChange={setFocus}
          onPracticeIssue={recordPracticeIssue}
        />
      </main>
      {focus ? <button className="focus-exit" onClick={() => setFocus(false)}><X size={16} />집중 모드 종료</button> : null}
      <GlossaryDialog terms={glossary} selectedId={selectedTerm} open={glossaryOpen} onClose={() => setGlossaryOpen(false)} onSelect={setSelectedTerm} />
    </div>
  );
}
