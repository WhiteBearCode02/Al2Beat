import "server-only";

import type { LanguageId } from "@/types/content";

export type RuntimeSpec = {
  sourceFile: string;
  version: string;
  compile?: { command: string; args: string[]; timeoutMs: number };
  execute: { command: string; args: string[] };
  requiresToolchainSnapshot: boolean;
};

export const RUNTIME_SPECS: Record<LanguageId, RuntimeSpec> = {
  c: {
    sourceFile: "main.c", version: "GCC snapshot / C17",
    compile: { command: "gcc", args: ["-std=c17", "-O2", "-pipe", "-o", "main", "main.c"], timeoutMs: 8_000 },
    execute: { command: "./main", args: [] }, requiresToolchainSnapshot: true,
  },
  cpp: {
    sourceFile: "main.cpp", version: "G++ snapshot / C++20",
    compile: { command: "g++", args: ["-std=c++20", "-O2", "-pipe", "-o", "main", "main.cpp"], timeoutMs: 8_000 },
    execute: { command: "./main", args: [] }, requiresToolchainSnapshot: true,
  },
  java: {
    sourceFile: "Main.java", version: "OpenJDK 21 snapshot",
    compile: { command: "javac", args: ["-encoding", "UTF-8", "Main.java"], timeoutMs: 8_000 },
    execute: { command: "java", args: ["-Xmx256m", "-Xss1m", "Main"] }, requiresToolchainSnapshot: true,
  },
  python: {
    sourceFile: "main.py", version: "Python 3.14",
    execute: { command: "python3", args: ["main.py"] }, requiresToolchainSnapshot: false,
  },
  csharp: {
    sourceFile: "Program.cs", version: ".NET SDK 8 / C#",
    compile: { command: "dotnet", args: ["build", "Main.csproj", "-c", "Release", "--nologo", "--verbosity", "quiet", "--ignore-failed-sources"], timeoutMs: 12_000 },
    execute: { command: "dotnet", args: ["bin/Release/net8.0/Main.dll"] }, requiresToolchainSnapshot: true,
  },
};

export function hasSandboxCredentials() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN ||
    (process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID));
}

export function getToolchainSnapshotId() {
  return process.env.AL2BEAT_TOOLCHAIN_SNAPSHOT_ID?.trim() || undefined;
}

export function isServerRuntimeAvailable(language: LanguageId) {
  if (!hasSandboxCredentials()) return false;
  return !RUNTIME_SPECS[language].requiresToolchainSnapshot || Boolean(getToolchainSnapshotId());
}

export function languageCapabilities(language: LanguageId) {
  const serverAvailable = isServerRuntimeAvailable(language);
  return {
    edit: true,
    run: language === "python" || serverAvailable,
    judge: serverAvailable,
    executionTarget: language === "python" ? "browser-worker" : serverAvailable ? "sandbox" : "unavailable",
    verifiedVersion: language === "python" ? "Python 3.14 (Pyodide)" : serverAvailable ? RUNTIME_SPECS[language].version : null,
  };
}
