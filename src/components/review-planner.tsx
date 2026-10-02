"use client";

import { CalendarClock, Check, NotebookPen } from "lucide-react";
import { useRef, useState } from "react";
import { DEFAULT_REVIEW_INTERVAL_DAYS, normalizeReviewInterval, reviewTiming, scheduleReview } from "@/lib/review";
import type { SavedProgress } from "@/lib/storage";

type ReviewPlannerProps = {
  progress?: SavedProgress;
  onChange: (updates: Partial<Omit<SavedProgress, "conceptId" | "updatedAt">>) => Promise<boolean>;
};

type NoteSaveState = "saved" | "dirty" | "saving" | "error";

export function ReviewPlanner({ progress, onChange }: ReviewPlannerProps) {
  const [interval, setInterval] = useState(progress?.reviewIntervalDays ?? DEFAULT_REVIEW_INTERVAL_DAYS);
  const [note, setNote] = useState(progress?.wrongNote ?? "");
  const [savedNote, setSavedNote] = useState(progress?.wrongNote ?? "");
  const [noteSaveState, setNoteSaveState] = useState<NoteSaveState>("saved");
  const noteRef = useRef(note);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const timing = reviewTiming(progress?.nextReviewAt);
  const reserve = (reviewed = false) => {
    const days = normalizeReviewInterval(interval);
    const now = new Date();
    setInterval(days);
    void onChange({
      reviewIntervalDays: days,
      nextReviewAt: scheduleReview(days, now),
      lastReviewedAt: reviewed ? now.toISOString() : progress?.lastReviewedAt,
      state: "review",
    });
  };

  const saveNote = async (value: string) => {
    if (value === savedNote) {
      setNoteSaveState("saved");
      return;
    }

    setNoteSaveState("saving");
    const saved = await onChange({ wrongNote: value });
    if (!saved) {
      setNoteSaveState("error");
      return;
    }

    setSavedNote(value);
    setNoteSaveState(noteRef.current === value ? "saved" : "dirty");
  };

  const noteStatus = {
    saved: "브라우저에 저장됨",
    dirty: "저장 전 변경사항",
    saving: "저장 중…",
    error: "저장 실패 · 다시 시도하세요",
  }[noteSaveState];

  return (
    <section className="review-planner panel" aria-labelledby="review-heading">
      <header>
        <div className="review-title"><CalendarClock size={18} /><div><p className="eyebrow">REVIEW LOOP</p><h2 id="review-heading">내 복습 박자</h2></div></div>
        <span className={timing.due ? "review-due" : "review-scheduled"}>{timing.label}</span>
      </header>
      <div className="review-controls">
        <label>
          복습 간격
          <span><input type="number" min="1" max="90" value={interval} onChange={(event) => setInterval(Number(event.target.value))} />일</span>
        </label>
        <button type="button" onClick={() => reserve(false)}>복습 예약</button>
        <button type="button" className="review-complete" onClick={() => reserve(true)}><Check size={15} />오늘 복습 완료</button>
      </div>
      <div className="wrong-note">
        <label htmlFor="wrong-note"><NotebookPen size={16} />오답 노트</label>
        {progress?.lastWrongSummary ? <p><b>마지막 확인된 결과</b>{progress.lastWrongSummary}</p> : null}
        <textarea
          id="wrong-note"
          value={note}
          maxLength={2_000}
          placeholder="막힌 지점, 다음에 확인할 조건, 직접 찾은 해결 방법을 기록하세요."
          onChange={(event) => {
            noteRef.current = event.target.value;
            setNote(event.target.value);
            setNoteSaveState(event.target.value === savedNote ? "saved" : "dirty");
          }}
          onBlur={(event) => {
            if (event.relatedTarget !== saveButtonRef.current) void saveNote(note);
          }}
        />
        <div>
          <small aria-live="polite">{note.length}/2,000 · {noteStatus}</small>
          <button ref={saveButtonRef} type="button" disabled={noteSaveState === "saving" || note === savedNote} onClick={() => void saveNote(note)}>
            {noteSaveState === "saving" ? "저장 중…" : "노트 저장"}
          </button>
        </div>
      </div>
    </section>
  );
}
