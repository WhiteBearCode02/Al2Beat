import assert from "node:assert/strict";
import test from "node:test";
import { normalizeReviewInterval, reviewTiming, scheduleReview } from "../src/lib/review.ts";

test("review interval is constrained to 1 through 90 days", () => {
  assert.equal(normalizeReviewInterval(-10), 1);
  assert.equal(normalizeReviewInterval(14.4), 14);
  assert.equal(normalizeReviewInterval(200), 90);
  assert.equal(normalizeReviewInterval(Number.NaN), 3);
});

test("review scheduling is deterministic and reports a due review", () => {
  const now = new Date("2026-09-30T00:00:00.000Z");
  assert.equal(scheduleReview(3, now), "2026-10-03T00:00:00.000Z");
  assert.deepEqual(reviewTiming("2026-09-29T00:00:00.000Z", now), { due: true, label: "오늘 복습할 차례" });
  assert.deepEqual(reviewTiming("2026-10-03T00:00:00.000Z", now), { due: false, label: "3일 뒤 복습" });
});
