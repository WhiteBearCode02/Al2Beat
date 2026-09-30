export const DEFAULT_REVIEW_INTERVAL_DAYS = 3;
export const MIN_REVIEW_INTERVAL_DAYS = 1;
export const MAX_REVIEW_INTERVAL_DAYS = 90;

export function normalizeReviewInterval(value: number) {
  if (!Number.isFinite(value)) return DEFAULT_REVIEW_INTERVAL_DAYS;
  return Math.min(MAX_REVIEW_INTERVAL_DAYS, Math.max(MIN_REVIEW_INTERVAL_DAYS, Math.round(value)));
}

export function scheduleReview(intervalDays: number, from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + normalizeReviewInterval(intervalDays));
  return next.toISOString();
}

export function reviewTiming(nextReviewAt: string | undefined, now = new Date()) {
  if (!nextReviewAt) return { due: false, label: "아직 예약되지 않음" };
  const target = new Date(nextReviewAt);
  if (Number.isNaN(target.getTime())) return { due: false, label: "예약 시각을 다시 설정해 주세요" };
  const dayMs = 24 * 60 * 60 * 1_000;
  const days = Math.ceil((target.getTime() - now.getTime()) / dayMs);
  if (days <= 0) return { due: true, label: "오늘 복습할 차례" };
  return { due: false, label: `${days}일 뒤 복습` };
}
