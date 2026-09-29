export type BrowserPythonResult = {
  status: "completed" | "compile_error" | "runtime_error" | "time_limit" | "output_limit" | "system_error";
  stdout: string;
  stderr: string;
  durationMs?: number;
};

type WorkerMessage = BrowserPythonResult & { type: "result"; id: string } | { type: "started"; id: string } | { type: "startup_error"; id: string; message: string };

const STARTUP_TIMEOUT_MS = 20_000;
const EXECUTION_TIMEOUT_MS = 3_000;

class BrowserPythonRunner {
  private worker: Worker | undefined;

  private createWorker() {
    this.worker?.terminate();
    this.worker = new Worker(new URL("../workers/python-runner.worker.ts", import.meta.url), { type: "module" });
    return this.worker;
  }

  async run(source: string, input: string): Promise<BrowserPythonResult> {
    const worker = this.worker ?? this.createWorker();
    const id = crypto.randomUUID();
    return new Promise((resolve) => {
      let settled = false;
      let executionTimer: number | undefined;
      const finish = (result: BrowserPythonResult, resetWorker = false) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(startupTimer);
        if (executionTimer) window.clearTimeout(executionTimer);
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
        if (resetWorker) {
          worker.terminate();
          if (this.worker === worker) this.worker = undefined;
        }
        resolve(result);
      };
      const onMessage = (event: MessageEvent<WorkerMessage>) => {
        const message = event.data;
        if (message.id !== id) return;
        if (message.type === "started") {
          executionTimer = window.setTimeout(() => finish({ status: "time_limit", stdout: "", stderr: "", durationMs: EXECUTION_TIMEOUT_MS }, true), EXECUTION_TIMEOUT_MS);
          return;
        }
        if (message.type === "startup_error") {
          finish({ status: "system_error", stdout: "", stderr: message.message }, true);
          return;
        }
        finish(message);
      };
      const onError = () => finish({ status: "system_error", stdout: "", stderr: "브라우저 Python 작업자가 예기치 않게 종료되었습니다." }, true);
      const startupTimer = window.setTimeout(() => {
        finish({ status: "system_error", stdout: "", stderr: "브라우저 Python 런타임을 준비하는 시간이 초과되었습니다." }, true);
      }, STARTUP_TIMEOUT_MS);
      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      worker.postMessage({ type: "run", id, source, input });
    });
  }
}

let runner: BrowserPythonRunner | undefined;

export function runBrowserPython(source: string, input: string) {
  runner ??= new BrowserPythonRunner();
  return runner.run(source, input);
}
