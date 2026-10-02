import { openDB, type DBSchema } from "idb";
import type { LanguageId } from "@/types/content";

export type ProgressState = "not-started" | "learning" | "review" | "complete";

export type SavedWorkspace = {
  id: string;
  conceptId: string;
  language: LanguageId;
  code: string;
  customInput: string;
  updatedAt: string;
};

export type SavedProgress = {
  conceptId: string;
  state: ProgressState;
  bookmarked: boolean;
  watchedScene: number;
  reviewIntervalDays?: number;
  nextReviewAt?: string;
  lastReviewedAt?: string;
  wrongNote?: string;
  lastWrongAt?: string;
  lastWrongSummary?: string;
  updatedAt: string;
};

export type BackupPayload = {
  format: "al2beat-backup";
  version: 1;
  exportedAt: string;
  workspaces: SavedWorkspace[];
  progress: SavedProgress[];
  preferences: Record<string, unknown>;
};

interface Al2BeatDb extends DBSchema {
  workspaces: { key: string; value: SavedWorkspace };
  progress: { key: string; value: SavedProgress };
  preferences: { key: string; value: { key: string; value: unknown } };
}

const dbPromise = typeof window === "undefined"
  ? null
  : openDB<Al2BeatDb>("al2beat", 1, {
      upgrade(db) {
        db.createObjectStore("workspaces", { keyPath: "id" });
        db.createObjectStore("progress", { keyPath: "conceptId" });
        db.createObjectStore("preferences", { keyPath: "key" });
      },
    });

export const workspaceKey = (conceptId: string, language: LanguageId) =>
  `${conceptId}:${language}`;

export async function getWorkspace(conceptId: string, language: LanguageId) {
  return dbPromise?.then((db) => db.get("workspaces", workspaceKey(conceptId, language)));
}

export async function saveWorkspace(value: Omit<SavedWorkspace, "id" | "updatedAt">) {
  const db = await dbPromise;
  if (!db) return;
  await db.put("workspaces", {
    ...value,
    id: workspaceKey(value.conceptId, value.language),
    updatedAt: new Date().toISOString(),
  });
}

export async function getAllProgress() {
  return (await dbPromise?.then((db) => db.getAll("progress"))) ?? [];
}

export async function saveProgress(value: SavedProgress) {
  const db = await dbPromise;
  if (!db) throw new Error("이 브라우저에서는 IndexedDB를 사용할 수 없습니다.");
  await db.put("progress", value);
}

export async function exportBackup(): Promise<BackupPayload> {
  const db = await dbPromise;
  if (!db) throw new Error("이 브라우저에서는 IndexedDB를 사용할 수 없습니다.");
  const preferences = Object.fromEntries(
    (await db.getAll("preferences")).map((item) => [item.key, item.value]),
  );
  return {
    format: "al2beat-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    workspaces: await db.getAll("workspaces"),
    progress: await db.getAll("progress"),
    preferences,
  };
}

function isBackup(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BackupPayload>;
  return item.format === "al2beat-backup" && item.version === 1 &&
    Array.isArray(item.workspaces) && Array.isArray(item.progress);
}

export async function importBackup(value: unknown) {
  if (!isBackup(value)) throw new Error("al2beat 백업 형식이 아니거나 지원하지 않는 버전입니다.");
  if (value.workspaces.length > 500 || value.progress.length > 100) {
    throw new Error("백업 항목 수가 허용 범위를 넘었습니다.");
  }
  const db = await dbPromise;
  if (!db) throw new Error("이 브라우저에서는 IndexedDB를 사용할 수 없습니다.");
  const tx = db.transaction(["workspaces", "progress", "preferences"], "readwrite");
  await Promise.all([
    ...value.workspaces.map((item) => tx.objectStore("workspaces").put(item)),
    ...value.progress.map((item) => tx.objectStore("progress").put(item)),
    ...Object.entries(value.preferences ?? {}).map(([key, pref]) =>
      tx.objectStore("preferences").put({ key, value: pref }),
    ),
    tx.done,
  ]);
}

export async function savePreference(key: string, value: unknown) {
  const db = await dbPromise;
  await db?.put("preferences", { key, value });
}

export async function getPreference<T>(key: string): Promise<T | undefined> {
  const item = await dbPromise?.then((db) => db.get("preferences", key));
  return item?.value as T | undefined;
}
