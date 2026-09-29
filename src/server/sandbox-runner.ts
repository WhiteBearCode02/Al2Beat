import "server-only";

import { Sandbox } from "@vercel/sandbox";
import type { LanguageId } from "@/types/content";
import { getToolchainSnapshotId, hasSandboxCredentials, isServerRuntimeAvailable, RUNTIME_SPECS } from "./language-runtimes.ts";

export const EXECUTION_LIMITS = {
  sourceBytes: 20_000, inputBytes: 10_000, outputBytes: 64_000,
  testsPerSubmission: 12, timeoutMs: 3_000, memoryMb: 256,
} as const;

export type SandboxRun = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  outputExceeded: boolean;
};

const WORKDIR = "/tmp/al2beat";
const CSHARP_PROJECT = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>disable</ImplicitUsings>
    <Nullable>disable</Nullable>
    <RestoreIgnoreFailedSources>true</RestoreIgnoreFailedSources>
  </PropertyGroup>
</Project>
`;

export function isSandboxSubmissionAvailable(language: LanguageId = "python") {
  return isServerRuntimeAvailable(language);
}

function shellQuote(value: string) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

async function readCapped(sandbox: Sandbox, file: string): Promise<{ text: string; exceeded: boolean }> {
  const result = await sandbox.runCommand("head", ["-c", String(EXECUTION_LIMITS.outputBytes + 1), `${WORKDIR}/${file}`]);
  const text = await result.stdout();
  return { text: text.slice(0, EXECUTION_LIMITS.outputBytes), exceeded: Buffer.byteLength(text, "utf8") > EXECUTION_LIMITS.outputBytes };
}

export async function createLanguageSandbox(language: LanguageId) {
  if (!hasSandboxCredentials()) throw new Error("Vercel Sandbox credentials are not configured.");
  if (!isServerRuntimeAvailable(language)) throw new Error(`Sandbox toolchain snapshot is not configured for ${language}.`);

  const credentials = process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID
    ? { token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID, projectId: process.env.VERCEL_PROJECT_ID }
    : {};
  const snapshotId = getToolchainSnapshotId();
  const sandbox = await Sandbox.create({
    ...credentials,
    ...(RUNTIME_SPECS[language].requiresToolchainSnapshot
      ? { source: { type: "snapshot" as const, snapshotId: snapshotId! } }
      : { image: "vercel/sandbox/python:3.14" }),
    networkPolicy: "deny-all",
    persistent: false,
    resources: { vcpus: 1 },
    timeout: 30_000,
    region: "hnd1",
  });
  await sandbox.mkDir(WORKDIR);
  return sandbox;
}

export async function writeLanguageSource(sandbox: Sandbox, language: LanguageId, source: string) {
  const files = [{ path: `${WORKDIR}/${RUNTIME_SPECS[language].sourceFile}`, content: Buffer.from(source, "utf8") }];
  if (language === "csharp") files.push({ path: `${WORKDIR}/Main.csproj`, content: Buffer.from(CSHARP_PROJECT, "utf8") });
  await sandbox.writeFiles(files);
}

async function collectRun(sandbox: Sandbox, prefix: string, durationMs: number): Promise<SandboxRun> {
  const [stdout, stderr, statusResult] = await Promise.all([
    readCapped(sandbox, `${prefix}-stdout.txt`),
    readCapped(sandbox, `${prefix}-stderr.txt`),
    sandbox.runCommand("cat", [`${WORKDIR}/${prefix}-exit.txt`]),
  ]);
  const exitCode = Number.parseInt((await statusResult.stdout()).trim(), 10);
  return {
    stdout: stdout.text,
    stderr: stderr.text,
    exitCode: Number.isFinite(exitCode) ? exitCode : 1,
    durationMs,
    timedOut: exitCode === 124 || exitCode === 137,
    outputExceeded: stdout.exceeded || stderr.exceeded || exitCode === 153,
  };
}

async function runCapturedCommand(sandbox: Sandbox, language: LanguageId, prefix: string, command: string, args: string[], timeoutMs: number, input = false) {
  const invocation = [shellQuote(command), ...args.map(shellQuote)].join(" ");
  const memoryGuard = language === "java"
    ? "export JAVA_TOOL_OPTIONS='-Xmx256m -Xss1m'"
    : language === "csharp"
      ? "export DOTNET_GCHeapHardLimit=0x10000000 DOTNET_CLI_TELEMETRY_OPTOUT=1"
      : `ulimit -v ${EXECUTION_LIMITS.memoryMb * 1024}`;
  const script = [
    `cd ${shellQuote(WORKDIR)}`,
    memoryGuard,
    "ulimit -f 128",
    `timeout --signal=KILL ${Math.ceil(timeoutMs / 1000)}s ${invocation}${input ? " < input.txt" : ""} > ${prefix}-stdout.txt 2> ${prefix}-stderr.txt`,
    "status=$?",
    `printf '%s' "$status" > ${prefix}-exit.txt`,
    "exit 0",
  ].join("; ");
  const startedAt = performance.now();
  const result = await sandbox.runCommand({ cmd: "bash", args: ["-lc", script], timeoutMs: timeoutMs + 2_000 });
  const durationMs = Math.round(performance.now() - startedAt);
  if (result.exitCode !== 0) {
    return { stdout: "", stderr: await result.stderr(), exitCode: result.exitCode, durationMs, timedOut: false, outputExceeded: false };
  }
  return collectRun(sandbox, prefix, durationMs);
}

export async function compileLanguage(sandbox: Sandbox, language: LanguageId): Promise<SandboxRun | null> {
  const compile = RUNTIME_SPECS[language].compile;
  if (!compile) return null;
  return runCapturedCommand(sandbox, language, "compile", compile.command, compile.args, compile.timeoutMs);
}

export async function runLanguage(sandbox: Sandbox, language: LanguageId, input: string): Promise<SandboxRun> {
  await sandbox.writeFiles([{ path: `${WORKDIR}/input.txt`, content: Buffer.from(input, "utf8") }]);
  const execute = RUNTIME_SPECS[language].execute;
  return runCapturedCommand(sandbox, language, "run", execute.command, execute.args, EXECUTION_LIMITS.timeoutMs, true);
}
