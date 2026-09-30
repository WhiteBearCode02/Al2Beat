"use client";

import { Captions, Gauge, Pause, Play, RotateCcw, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Concept } from "@/types/content";

const ITEMS = [0, 1, 2, 3, 4];
const VISUAL_LABELS: Partial<Record<Concept["scenes"][number]["visual"], string[]>> = {
  stack: ["(", "[", "{", "}", "]"],
  deque: ["L", "2", "3", "4", "R"],
  "linked-list": ["b", "e", "a", "t", "→"],
  heap: ["1", "3", "2", "8", "5"],
  "union-find": ["1", "1", "3", "1", "5"],
};

function SceneVisual({ concept, scene }: { concept: Concept; scene: number }) {
  const kind = concept.scenes[scene].visual;
  return (
    <div className={`scene-visual visual-${kind}`} role="img" aria-label={concept.scenes[scene].caption}>
      <div className="grid-lines" aria-hidden="true" />
      {ITEMS.map((item) => (
        <span
          className={`visual-node node-${item} ${item <= scene % 5 ? "is-active" : ""}`}
          key={item}
          aria-hidden="true"
        >
          {VISUAL_LABELS[kind]?.[item] ?? item + 1}
        </span>
      ))}
      <svg viewBox="0 0 560 220" aria-hidden="true" className="visual-path">
        <path d="M72 164 C150 30 214 196 294 76 S430 30 492 142" />
      </svg>
      <div className="scene-metric" aria-hidden="true">
        <span>{String(scene + 1).padStart(2, "0")}</span>
        <small>CHECKPOINT</small>
      </div>
    </div>
  );
}

export function MotionLesson({ concept, onScene }: { concept: Concept; onScene: (scene: number) => void }) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [transcript, setTranscript] = useState(false);
  const lastTime = useRef<number | null>(null);
  const sceneLength = concept.duration / concept.scenes.length;
  const scene = Math.min(concept.scenes.length - 1, Math.floor(elapsed / sceneLength));

  useEffect(() => {
    onScene(scene);
  }, [scene, onScene]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (time: number) => {
      if (lastTime.current === null) lastTime.current = time;
      const delta = ((time - lastTime.current) / 1000) * speed;
      lastTime.current = time;
      setElapsed((current) => {
        const next = current + delta;
        if (next >= concept.duration) {
          setPlaying(false);
          return concept.duration;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastTime.current = null;
    };
  }, [concept.duration, playing, speed]);

  const progress = useMemo(() => (elapsed / concept.duration) * 100, [concept.duration, elapsed]);
  const seek = (value: number) => setElapsed((value / 100) * concept.duration);

  return (
    <section className="lesson-card panel" aria-labelledby="video-heading">
      <header className="panel-header">
        <div>
          <p className="eyebrow">ORIGINAL MOTION · {concept.duration} SEC</p>
          <h2 id="video-heading">{concept.title} 한 곡 듣기</h2>
        </div>
        <span className="status-pill ready">직접 제작</span>
      </header>
      <div className="motion-player">
        <SceneVisual concept={concept} scene={scene} />
        <div className="scene-copy" aria-live="polite">
          <span>{scene + 1} / {concept.scenes.length}</span>
          <h3>{concept.scenes[scene].title}</h3>
          {captions ? <p>{concept.scenes[scene].caption}</p> : null}
        </div>
        <div className="player-controls">
          <button className="icon-button strong" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "일시 정지" : "재생"}>
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button className="icon-button" onClick={() => { setPlaying(false); setElapsed(0); }} aria-label="처음부터">
            <RotateCcw size={16} />
          </button>
          <input className="timeline" type="range" min="0" max="100" step="0.1" value={progress} onChange={(event) => seek(Number(event.target.value))} aria-label="영상 재생 위치" />
          <time>{Math.floor(elapsed)} / {concept.duration}s</time>
          <button className={`icon-button ${captions ? "is-on" : ""}`} onClick={() => setCaptions((value) => !value)} aria-label="자막 켜기 또는 끄기" aria-pressed={captions}>
            <Captions size={17} />
          </button>
          <label className="speed-control"><Gauge size={15} /><span className="sr-only">재생 속도</span>
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              <option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option>
            </select>
          </label>
          <span className="silent-label" title="이 모션 설명은 의도적으로 소리가 없습니다."><VolumeX size={15} /> 무음</span>
        </div>
      </div>
      <button className="text-button transcript-toggle" onClick={() => setTranscript((value) => !value)} aria-expanded={transcript}>
        {transcript ? "대본 닫기" : "전체 대본 보기"}
      </button>
      {transcript ? (
        <ol className="transcript-list">
          {concept.transcript.map((line, index) => <li key={line}><time>{index * sceneLength}초</time>{line}</li>)}
        </ol>
      ) : null}
    </section>
  );
}
