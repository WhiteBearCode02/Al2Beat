"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="fatal-error">
      <p className="eyebrow">SYSTEM PAUSE</p>
      <h1>학습 화면을 불러오지 못했습니다.</h1>
      <p>브라우저에 저장된 코드는 지워지지 않습니다. 잠시 뒤 다시 시도해 주세요.</p>
      <button className="primary-button" onClick={reset}>다시 시도</button>
    </main>
  );
}
