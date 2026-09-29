type RunRequest = {
  type: "run";
  id: string;
  source: string;
  input: string;
};

type RunResult = {
  type: "result";
  id: string;
  status: "completed" | "compile_error" | "runtime_error" | "output_limit";
  stdout: string;
  stderr: string;
  durationMs: number;
};

type Pyodide = {
  FS: { writeFile(path: string, data: string): void };
  setStdout(options: { batched(value: string): void }): void;
  setStderr(options: { batched(value: string): void }): void;
  runPythonAsync(code: string): Promise<unknown>;
};

const OUTPUT_LIMIT = 64_000;
const encoder = new TextEncoder();
let runtime: Promise<Pyodide> | undefined;

async function getRuntime() {
  if (!runtime) {
    runtime = (async () => {
      // The runtime is served from this app, rather than a third-party CDN.
      const runtimeUrl = new URL("/vendor/pyodide/pyodide.mjs", self.location.origin).href;
      const pyodideModule = await import(/* webpackIgnore: true */ runtimeUrl) as {
        loadPyodide(options: { indexURL: string }): Promise<Pyodide>;
      };
      return pyodideModule.loadPyodide({ indexURL: new URL("/vendor/pyodide/", self.location.origin).href });
    })();
  }
  return runtime;
}

function classify(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /SyntaxError|IndentationError|TabError/.test(message) ? "compile_error" as const : "runtime_error" as const;
}

self.addEventListener("message", async (event: MessageEvent<RunRequest>) => {
  if (event.data.type !== "run") return;
  const { id, source, input } = event.data;
  try {
    const pyodide = await getRuntime();
    self.postMessage({ type: "started", id });
    const startedAt = performance.now();
    let stdout = "";
    let stderr = "";
    let outputExceeded = false;
    const append = (current: string, value: string) => {
      if (outputExceeded) return current;
      const remaining = OUTPUT_LIMIT - encoder.encode(current).byteLength;
      if (encoder.encode(value).byteLength > remaining) {
        outputExceeded = true;
        return current + value.slice(0, Math.max(0, remaining));
      }
      return current + value;
    };
    pyodide.setStdout({ batched: (value) => { stdout = append(stdout, value); } });
    pyodide.setStderr({ batched: (value) => { stderr = append(stderr, value); } });
    pyodide.FS.writeFile("/tmp/al2beat-input.txt", input);
    pyodide.FS.writeFile("/tmp/al2beat-main.py", source);
    try {
      await pyodide.runPythonAsync([
        "import runpy, sys",
        "sys.stdin = open('/tmp/al2beat-input.txt', 'r', encoding='utf-8')",
        "runpy.run_path('/tmp/al2beat-main.py', run_name='__main__')",
      ].join("\n"));
      const result: RunResult = {
        type: "result", id,
        status: outputExceeded ? "output_limit" : "completed",
        stdout, stderr, durationMs: Math.round(performance.now() - startedAt),
      };
      self.postMessage(result);
    } catch (error) {
      const result: RunResult = {
        type: "result", id,
        status: outputExceeded ? "output_limit" : classify(error),
        stdout, stderr: stderr || (error instanceof Error ? error.message : String(error)),
        durationMs: Math.round(performance.now() - startedAt),
      };
      self.postMessage(result);
    }
  } catch (error) {
    self.postMessage({ type: "startup_error", id, message: error instanceof Error ? error.message : String(error) });
  }
});
