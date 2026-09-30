import { Sandbox } from "@vercel/sandbox";

if (process.env.AL2BEAT_CONFIRM_SANDBOX_USAGE !== "CREATE_FREE_TIER_SNAPSHOT") {
  throw new Error("Set AL2BEAT_CONFIRM_SANDBOX_USAGE=CREATE_FREE_TIER_SNAPSHOT only after checking your Vercel Hobby usage and terms.");
}

const credentials = process.env.VERCEL_TOKEN && process.env.VERCEL_TEAM_ID && process.env.VERCEL_PROJECT_ID
  ? { token: process.env.VERCEL_TOKEN, teamId: process.env.VERCEL_TEAM_ID, projectId: process.env.VERCEL_PROJECT_ID }
  : {};
const region = process.env.AL2BEAT_SANDBOX_REGION === "hnd1" ? "hnd1" : "iad1";

const sandbox = await Sandbox.create({ ...credentials, runtime: "node24", region, timeout: 10 * 60 * 1000 });
let snapshotted = false;
try {
  const install = await sandbox.runCommand({
    cmd: "bash",
    args: ["-lc", [
      "set -euo pipefail",
      "if command -v dnf >/dev/null 2>&1; then dnf install -y gcc gcc-c++ java-21-amazon-corretto-devel dotnet-sdk-8.0",
      "elif command -v apt-get >/dev/null 2>&1; then apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y gcc g++ openjdk-21-jdk-headless dotnet-sdk-8.0",
      "else echo 'Unsupported Sandbox base image: no dnf or apt-get' >&2; exit 1; fi",
    ].join("; ")],
    sudo: true,
    timeoutMs: 8 * 60 * 1000,
  });
  if (install.exitCode !== 0) throw new Error(`Toolchain installation failed: ${await install.stderr()}`);

  const probes = await Promise.all([
    sandbox.runCommand("gcc", ["--version"]),
    sandbox.runCommand("g++", ["--version"]),
    sandbox.runCommand("java", ["-version"]),
    sandbox.runCommand("javac", ["-version"]),
    sandbox.runCommand("dotnet", ["--version"]),
  ]);
  const versions = [];
  for (const probe of probes) {
    if (probe.exitCode !== 0) throw new Error(`Runtime verification failed: ${await probe.stderr()}`);
    versions.push(`${await probe.stdout()}${await probe.stderr()}`.trim().split("\n")[0]);
  }

  await sandbox.updateNetworkPolicy("deny-all");
  const snapshot = await sandbox.snapshot();
  snapshotted = true;
  console.log(`Verified toolchains: ${versions.join(" | ")}`);
  console.log(`Sandbox region: ${region}`);
  console.log(`AL2BEAT_TOOLCHAIN_SNAPSHOT_ID=${snapshot.snapshotId}`);
  console.log("Store this value only in Vercel environment settings or an uncommitted .env.local file.");
} finally {
  if (!snapshotted) await sandbox.stop().catch(() => undefined);
}
