import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPrivateTests } from "../src/server/private-tests.ts";
import { getReferenceSolution } from "../src/server/reference-solutions.ts";

const concepts = JSON.parse(readFileSync(new URL("../content/concepts.json", import.meta.url), "utf8"));
const root = mkdtempSync(join(tmpdir(), "al2beat-solutions-"));

function isAvailable(command, args = ["--version"]) {
  return spawnSync(command, args, { encoding: "utf8", windowsHide: true }).status === 0;
}

function normalized(value) {
  return value.replaceAll("\r\n", "\n").trimEnd();
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
    ...options,
  });
}

const dotnetMajor = isAvailable("dotnet")
  ? Number.parseInt(execFileSync("dotnet", ["--version"], { encoding: "utf8", windowsHide: true }), 10)
  : 0;

const runtimes = [
  {
    language: "c",
    available: isAvailable("gcc"),
    prepare(directory, source) {
      writeFileSync(join(directory, "main.c"), source);
      return run("gcc", ["-std=c17", "-O2", "main.c", "-o", process.platform === "win32" ? "main.exe" : "main"], { cwd: directory });
    },
    execute(directory, input) { return run(join(directory, process.platform === "win32" ? "main.exe" : "main"), [], { cwd: directory, input }); },
  },
  {
    language: "cpp",
    available: isAvailable("g++"),
    prepare(directory, source) {
      writeFileSync(join(directory, "main.cpp"), source);
      return run("g++", ["-std=c++20", "-O2", "main.cpp", "-o", process.platform === "win32" ? "main.exe" : "main"], { cwd: directory });
    },
    execute(directory, input) { return run(join(directory, process.platform === "win32" ? "main.exe" : "main"), [], { cwd: directory, input }); },
  },
  {
    language: "java",
    available: isAvailable("javac", ["-version"]) && isAvailable("java", ["-version"]),
    prepare(directory, source) {
      writeFileSync(join(directory, "Main.java"), source);
      return run("javac", ["-encoding", "UTF-8", "Main.java"], { cwd: directory });
    },
    execute(directory, input) { return run("java", ["-cp", directory, "Main"], { cwd: directory, input }); },
  },
  {
    language: "csharp",
    available: dotnetMajor >= 6,
    prepare(directory, source) {
      writeFileSync(join(directory, "Program.cs"), source);
      writeFileSync(join(directory, "Main.csproj"), `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net${dotnetMajor}.0</TargetFramework><ImplicitUsings>disable</ImplicitUsings><Nullable>disable</Nullable></PropertyGroup></Project>`);
      writeFileSync(join(directory, "NuGet.Config"), `<?xml version="1.0" encoding="utf-8"?><configuration><packageSources><clear /></packageSources></configuration>`);
      const dotnetHome = join(directory, ".dotnet");
      mkdirSync(dotnetHome);
      const env = { ...process.env, DOTNET_CLI_HOME: dotnetHome, DOTNET_CLI_TELEMETRY_OPTOUT: "1", DOTNET_NOLOGO: "1" };
      const restored = run("dotnet", ["restore", "Main.csproj", "--configfile", "NuGet.Config", "--ignore-failed-sources", "--nologo", "--verbosity", "quiet"], { cwd: directory, env });
      if (restored.status !== 0) return restored;
      return run("dotnet", ["build", "Main.csproj", "-c", "Release", "-o", "out", "--no-restore", "--nologo", "--verbosity", "quiet"], { cwd: directory, env });
    },
    execute(directory, input) { return run("dotnet", [join(directory, "out", "Main.dll")], { cwd: directory, input }); },
  },
];

let verified = 0;
try {
  for (const runtime of runtimes) {
    if (!runtime.available) {
      console.log(`SKIP ${runtime.language}: 로컬 컴파일러 없음`);
      continue;
    }
    for (const concept of concepts) {
      const directory = join(root, runtime.language, concept.id);
      mkdirSync(directory, { recursive: true });
      const compiled = runtime.prepare(directory, getReferenceSolution(concept.id, runtime.language));
      if (compiled.status !== 0)
        throw new Error(`${runtime.language}/${concept.id} compile failed\n${compiled.stdout}\n${compiled.stderr}`);
      const cases = [
        ...concept.problem.examples.map(({ input, output }) => ({ input, expected: output })),
        ...getPrivateTests(concept.id),
      ];
      for (const testCase of cases) {
        const executed = runtime.execute(directory, testCase.input);
        if (executed.status !== 0) throw new Error(`${runtime.language}/${concept.id} execution failed\n${executed.stderr}`);
        if (normalized(executed.stdout) !== normalized(testCase.expected))
          throw new Error(`${runtime.language}/${concept.id} output mismatch`);
      }
      verified++;
    }
    console.log(`PASS ${runtime.language}: 8개 기준 풀이 컴파일·실행`);
  }
  console.log(`로컬 검증 완료: ${verified}개 풀이`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
