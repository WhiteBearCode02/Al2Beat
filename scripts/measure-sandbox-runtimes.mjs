import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Sandbox, Snapshot } from "@vercel/sandbox";

const CONFIRMATION = "MEASURE_RUNTIME_RESOURCES";
const RUNS = 5;
const snapshotId = process.env.AL2BEAT_TOOLCHAIN_SNAPSHOT_ID?.trim();
const region = process.env.AL2BEAT_SANDBOX_REGION === "hnd1" ? "hnd1" : "iad1";

if (process.env.AL2BEAT_CONFIRM_SANDBOX_USAGE !== CONFIRMATION) {
  throw new Error(`Sandbox 사용량 보호: AL2BEAT_CONFIRM_SANDBOX_USAGE=${CONFIRMATION} 를 명시한 경우에만 실측합니다.`);
}
if (!snapshotId) throw new Error("AL2BEAT_TOOLCHAIN_SNAPSHOT_ID가 필요합니다.");

const credentials = process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID
  ? { token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID, projectId: process.env.VERCEL_PROJECT_ID }
  : {};

const probes = {
  c: {
    files: [{ path: "main.c", content: "#include <stdio.h>\nint main(void){puts(\"42\");return 0;}\n" }],
    compile: "gcc -std=c17 -O2 -o main main.c",
    execute: "./main",
    artifact: "main",
  },
  cpp: {
    files: [{ path: "main.cpp", content: "#include <iostream>\nint main(){std::cout << 42 << '\\n';}\n" }],
    compile: "g++ -std=c++20 -O2 -o main main.cpp",
    execute: "./main",
    artifact: "main",
  },
  java: {
    files: [{ path: "Main.java", content: "public class Main { public static void main(String[] args) { System.out.println(42); } }\n" }],
    compile: "javac -encoding UTF-8 Main.java",
    execute: "java -Xmx256m -Xss1m Main",
    artifact: "Main.class",
  },
  csharp: {
    files: [
      { path: "Program.cs", content: "using System; class Program { static void Main() { Console.WriteLine(42); } }\n" },
      { path: "Main.csproj", content: "<Project Sdk=\"Microsoft.NET.Sdk\"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>disable</ImplicitUsings><Nullable>disable</Nullable></PropertyGroup></Project>\n" },
      { path: "NuGet.Config", content: "<?xml version=\"1.0\" encoding=\"utf-8\"?><configuration><packageSources><clear /></packageSources></configuration>\n" },
    ],
    compile: "DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 dotnet restore Main.csproj --configfile NuGet.Config --ignore-failed-sources --nologo --verbosity quiet && dotnet build Main.csproj -c Release --no-restore --nologo --verbosity quiet -p:UseSharedCompilation=false",
    execute: "DOTNET_GCHeapHardLimit=0x10000000 ./bin/Release/net8.0/Main",
    artifact: "bin/Release/net8.0/Main",
  },
  python: {
    files: [{ path: "main.py", content: "print(42)\n" }],
    execute: "python3 main.py",
    artifact: "main.py",
  },
};

const round = (value) => Math.round(value * 100) / 100;
const average = (values) => round(values.reduce((sum, value) => sum + value, 0) / values.length);
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)];
const redact = (value) => value.length < 12 ? "redacted" : `${value.slice(0, 7)}…${value.slice(-4)}`;

async function runChecked(sandbox, command, cwd) {
  const result = await sandbox.runCommand("bash", ["-lc", command], { cwd });
  if (result.exitCode !== 0) throw new Error(`${command} 실패: ${(await result.stderr()).slice(0, 2_000)}`);
  return result;
}

async function measureLanguage(sandbox, language) {
  const probe = probes[language];
  const cwd = `/tmp/al2beat-measure/${language}`;
  await sandbox.mkDir(cwd);
  await sandbox.writeFiles(probe.files.map((file) => ({ path: `${cwd}/${file.path}`, content: Buffer.from(file.content) })));

  let compileDurationMs = null;
  if (probe.compile) {
    const startedAt = performance.now();
    await runChecked(sandbox, probe.compile, cwd);
    compileDurationMs = round(performance.now() - startedAt);
  }

  const startupMs = [];
  for (let index = 0; index < RUNS; index++) {
    const result = await runChecked(sandbox, probe.execute, cwd);
    startupMs.push(result.durationMs ?? 0);
  }

  const memoryFile = `${cwd}/memory.txt`;
  await runChecked(sandbox, `/usr/bin/time -v -o ${memoryFile} bash -lc '${probe.execute.replaceAll("'", "'\\''")} >/dev/null'`, cwd);
  const memoryText = await (await sandbox.runCommand("cat", [memoryFile])).stdout();
  const rssMatch = memoryText.match(/Maximum resident set size \(kbytes\):\s*(\d+)/);
  const artifactResult = await runChecked(sandbox, `du -sb ${probe.artifact} | cut -f1`, cwd);
  const artifactBytes = Number.parseInt((await artifactResult.stdout()).trim(), 10);

  return {
    compileDurationMs,
    processStartToExitMs: { samples: startupMs, average: average(startupMs), p95: percentile(startupMs, 0.95) },
    peakProcessRssKiB: rssMatch ? Number.parseInt(rssMatch[1], 10) : null,
    artifactBytes: Number.isFinite(artifactBytes) ? artifactBytes : null,
  };
}

async function createMeasuredSandbox(options) {
  const startedAt = performance.now();
  const sandbox = await Sandbox.create({
    ...credentials,
    ...options,
    networkPolicy: "deny-all",
    persistent: false,
    resources: { vcpus: 1 },
    timeout: 120_000,
    region,
  });
  return { sandbox, createDurationMs: round(performance.now() - startedAt) };
}

async function stopAndCollect(sandbox) {
  await sandbox.stop();
  const sessions = await sandbox.listSessions({ limit: 1, sortOrder: "desc" });
  const session = sessions.sessions[0];
  return session ? {
    provisionedMemoryMb: session.memory,
    vcpus: session.vcpus,
    durationMs: session.duration ?? null,
    activeCpuDurationMs: session.activeCpuDurationMs ?? null,
    networkTransferBytes: session.networkTransfer ?? null,
    networkPolicy: session.networkPolicy?.mode ?? null,
  } : null;
}

const snapshot = await Snapshot.get({ ...credentials, snapshotId });
const report = {
  measuredAt: new Date().toISOString(),
  methodology: {
    repetitions: RUNS,
    processStart: "SDK runCommand dispatch부터 프로세스 종료까지의 durationMs",
    nativeMemory: "/usr/bin/time -v의 Maximum resident set size; microVM 전체 실사용량이 아니라 언어 프로세스 트리의 피크 RSS",
    sandboxCreation: "Sandbox.create 호출부터 준비 완료까지의 벽시계 시간",
    network: "모든 측정 Sandbox는 생성 시 deny-all",
  },
  toolchainSnapshot: {
    id: redact(snapshotId),
    sizeBytes: snapshot.sizeBytes,
    regions: snapshot.regions,
    expiresAt: snapshot.expiresAt?.toISOString() ?? null,
  },
  managedPythonImage: { image: "vercel/sandbox/python:3.14", sizeBytes: null, uncertainty: "관리형 이미지 크기는 Sandbox SDK가 노출하지 않음" },
  sandboxes: {},
  languages: {},
};

let toolchainSandbox;
let pythonSandbox;
try {
  const toolchain = await createMeasuredSandbox({ source: { type: "snapshot", snapshotId } });
  toolchainSandbox = toolchain.sandbox;
  report.sandboxes.toolchain = { createDurationMs: toolchain.createDurationMs };
  for (const language of ["c", "cpp", "java", "csharp"]) report.languages[language] = await measureLanguage(toolchainSandbox, language);
  report.sandboxes.toolchain.session = await stopAndCollect(toolchainSandbox);
  toolchainSandbox = undefined;

  const python = await createMeasuredSandbox({ image: "vercel/sandbox/python:3.14" });
  pythonSandbox = python.sandbox;
  report.sandboxes.python = { createDurationMs: python.createDurationMs };
  report.languages.python = await measureLanguage(pythonSandbox, "python");
  report.sandboxes.python.session = await stopAndCollect(pythonSandbox);
  pythonSandbox = undefined;
} finally {
  await toolchainSandbox?.stop().catch(() => undefined);
  await pythonSandbox?.stop().catch(() => undefined);
}

const outputDir = resolve("docs", "measurements");
await mkdir(outputDir, { recursive: true });
const stamp = report.measuredAt.slice(0, 10);
const outputPath = resolve(outputDir, `sandbox-runtime-${stamp}.json`);
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`측정 완료: ${outputPath}`);
