import "server-only";

import { Sandbox } from "@vercel/sandbox";

export const EXECUTION_LIMITS = {
  sourceBytes: 20_000,
  inputBytes: 10_000,
  outputBytes: 64_000,
  testsPerSubmission: 12,
  timeoutMs: 3_000,
  memoryMb: 256,
} as const;

/** Server-only submission is available only inside an authenticated Vercel project. */
export function isSandboxSubmissionAvailable() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN);
}

export type SandboxRun = {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timedOut: boolean;
  outputExceeded: boolean;
};

const WORKDIR = "/tmp/al2beat";
const RUN_SCRIPT = [
  `cd ${WORKDIR}`,
  "ulimit -v 262144",
  "ulimit -f 128",
  "timeout --signal=KILL 3s python3 main.py < input.txt > stdout.txt 2> stderr.txt",
  "status=$?",
  "printf '%s' \"$status\" > exit.txt",
  "exit 0",
].join("; ");

async function readCapped(sandbox: Sandbox, file: string): Promise<{ text: string; exceeded: boolean }> {
  const result = await sandbox.runCommand("head", ["-c", String(EXECUTION_LIMITS.outputBytes + 1), `${WORKDIR}/${file}`]);
  const text = await result.stdout();
  return {
    text: text.slice(0, EXECUTION_LIMITS.outputBytes),
    exceeded: Buffer.byteLength(text, "utf8") > EXECUTION_LIMITS.outputBytes,
  };
}

export async function createPythonSandbox() {
  const sandbox = await Sandbox.create({
    image: "vercel/sandbox/python:3.14",
    networkPolicy: "deny-all",
    persistent: false,
    resources: { vcpus: 1 },
    timeout: 20_000,
    region: "hnd1",
  });
  await sandbox.mkDir(WORKDIR);
  return sandbox;
}

export async function writePythonSource(sandbox: Sandbox, source: string) {
  await sandbox.writeFiles([
    { path: `${WORKDIR}/main.py`, content: Buffer.from(source, "utf8") },
  ]);
}

export async function runPython(sandbox: Sandbox, input: string): Promise<SandboxRun> {
  await sandbox.writeFiles([
    { path: `${WORKDIR}/input.txt`, content: Buffer.from(input, "utf8") },
  ]);

  const startedAt = performance.now();
  const command = await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", RUN_SCRIPT],
    timeoutMs: EXECUTION_LIMITS.timeoutMs + 1_500,
  });
  const durationMs = Math.round(performance.now() - startedAt);

  if (command.exitCode !== 0) {
    return {
      stdout: "",
      stderr: await command.stderr(),
      exitCode: command.exitCode,
      durationMs,
      timedOut: command.exitCode === 137,
      outputExceeded: false,
    };
  }

  const [stdout, stderr, statusResult] = await Promise.all([
    readCapped(sandbox, "stdout.txt"),
    readCapped(sandbox, "stderr.txt"),
    sandbox.runCommand("cat", [`${WORKDIR}/exit.txt`]),
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
