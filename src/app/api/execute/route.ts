import { randomUUID } from "node:crypto";
import { z } from "zod";
import { concepts } from "@/lib/content";
import { getPrivateTests } from "@/server/private-tests";
import { createPythonSandbox, EXECUTION_LIMITS, runPython, writePythonSource, type SandboxRun } from "@/server/sandbox-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const requestSchema = z.object({
  action: z.enum(["run", "submit"]),
  problemId: z.enum(["stack", "queue", "hash-map", "binary-search", "merge-sort", "bfs", "dfs", "basic-dp"]),
  language: z.enum(["c", "cpp", "java", "python", "csharp"]),
  source: z.string().min(1).max(20_000),
  input: z.string().max(10_000).default(""),
  idempotencyKey: z.string().min(16).max(100),
});

type RateEntry = { resetAt: number; runs: number; submissions: number };
const rates = new Map<string, RateEntry>();
const recent = new Map<string, number>();

function errorResponse(status: number, code: string, message: string, requestId: string, retryable = false) {
  return Response.json({ ok: false, error: { code, message, retryable, requestId } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").trimEnd();
}

export function runtimeFailure(run: SandboxRun) {
  if (run.outputExceeded) return { status: "output_limit" as const, label: "출력 초과", message: "출력이 64KB 제한을 넘었습니다." };
  if (run.timedOut) return { status: "time_limit" as const, label: "시간 초과", message: "실행 시간이 3초 제한을 넘었습니다." };
  if (run.exitCode !== 0) {
    const syntaxError = /SyntaxError|IndentationError|TabError/.test(run.stderr);
    return {
      status: syntaxError ? "compile_error" as const : "runtime_error" as const,
      label: syntaxError ? "구문 오류" : "런타임 오류",
      message: run.stderr || `프로그램이 종료 코드 ${run.exitCode}로 끝났습니다.`,
    };
  }
  return null;
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 35_000) return errorResponse(413, "PAYLOAD_TOO_LARGE", "요청 크기가 제한을 넘었습니다.", requestId);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "JSON 요청을 읽을 수 없습니다.", requestId);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, "INVALID_REQUEST", "요청 필드 또는 크기 제한을 확인해 주세요.", requestId);
  if (Buffer.byteLength(parsed.data.source, "utf8") > EXECUTION_LIMITS.sourceBytes || Buffer.byteLength(parsed.data.input, "utf8") > EXECUTION_LIMITS.inputBytes) {
    return errorResponse(413, "PAYLOAD_TOO_LARGE", "소스 또는 입력의 바이트 제한을 넘었습니다.", requestId);
  }
  if (parsed.data.language !== "python") {
    return errorResponse(422, "LANGUAGE_NOT_READY", "이 언어는 편집만 지원합니다. 현재 실제 실행·채점이 검증된 언어는 Python입니다.", requestId);
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientId = forwarded || "local";
  const now = Date.now();
  const entry = rates.get(clientId);
  const rate = !entry || entry.resetAt <= now ? { resetAt: now + 60_000, runs: 0, submissions: 0 } : entry;
  if (parsed.data.action === "run" && rate.runs >= 10) return errorResponse(429, "RATE_LIMITED", "예제 실행은 분당 10회까지 가능합니다.", requestId, true);
  if (parsed.data.action === "submit" && rate.submissions >= 3) return errorResponse(429, "RATE_LIMITED", "제출은 분당 3회까지 가능합니다.", requestId, true);
  if (parsed.data.action === "run") rate.runs++;
  else rate.submissions++;
  rates.set(clientId, rate);

  const duplicateKey = `${clientId}:${parsed.data.idempotencyKey}`;
  const previous = recent.get(duplicateKey);
  if (previous && now - previous < 60_000) return errorResponse(409, "DUPLICATE_REQUEST", "같은 요청을 이미 접수했습니다.", requestId);
  recent.set(duplicateKey, now);
  for (const [key, timestamp] of recent) if (now - timestamp > 60_000) recent.delete(key);

  const concept = concepts.find((item) => item.id === parsed.data.problemId);
  if (!concept) return errorResponse(404, "PROBLEM_NOT_FOUND", "문제를 찾을 수 없습니다.", requestId);

  let sandbox: Awaited<ReturnType<typeof createPythonSandbox>> | undefined;
  try {
    sandbox = await createPythonSandbox();
    await writePythonSource(sandbox, parsed.data.source);

    if (parsed.data.action === "run") {
      const run = await runPython(sandbox, parsed.data.input);
      const failure = runtimeFailure(run);
      if (failure) {
        return Response.json({ ok: true, result: { ...failure, action: "run", stdout: run.stdout, stderr: run.stderr, durationMs: run.durationMs, confirmed: failure.message } }, { headers: { "Cache-Control": "no-store" } });
      }
      const publicCase = concept.problem.examples.find((item) => normalizeOutput(item.input) === normalizeOutput(parsed.data.input));
      const matches = publicCase ? normalizeOutput(run.stdout) === normalizeOutput(publicCase.output) : null;
      return Response.json({
        ok: true,
        result: {
          status: matches === false ? "wrong_answer" : matches === true ? "accepted" : "completed",
          label: matches === false ? "예제 불일치" : matches === true ? "예제 통과" : "실행 완료",
          action: "run",
          stdout: run.stdout,
          stderr: run.stderr,
          expected: publicCase?.output,
          input: publicCase?.input,
          durationMs: run.durationMs,
          confirmed: matches === false ? "공개 예제의 기대 출력과 실제 출력이 다릅니다." : matches === true ? "공개 예제에서 기대 출력과 일치했습니다." : "직접 입력 실행이 정상 종료되었습니다. 정답 여부는 판정하지 않습니다.",
        },
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const cases = [
      ...concept.problem.examples.map((item) => ({ input: item.input, expected: item.output, category: "공개 예제", public: true })),
      ...getPrivateTests(concept.id).map((item) => ({ ...item, public: false })),
    ].slice(0, EXECUTION_LIMITS.testsPerSubmission);

    for (let index = 0; index < cases.length; index++) {
      const testCase = cases[index];
      const run = await runPython(sandbox, testCase.input);
      const failure = runtimeFailure(run);
      if (failure) {
        return Response.json({ ok: true, result: { ...failure, action: "submit", stdout: testCase.public ? run.stdout : undefined, stderr: run.stderr, durationMs: run.durationMs, passed: index, total: cases.length, confirmed: failure.message } }, { headers: { "Cache-Control": "no-store" } });
      }
      if (normalizeOutput(run.stdout) !== normalizeOutput(testCase.expected)) {
        return Response.json({
          ok: true,
          result: {
            status: "wrong_answer",
            label: "오답",
            action: "submit",
            passed: index,
            total: cases.length,
            input: testCase.public ? testCase.input : undefined,
            expected: testCase.public ? testCase.expected : undefined,
            stdout: testCase.public ? run.stdout : undefined,
            durationMs: run.durationMs,
            confirmed: testCase.public ? "공개 예제의 기대 출력과 실제 출력이 다릅니다." : `비공개 테스트 범주 ‘${testCase.category}’에서 정답과 일치하지 않았습니다. 입력과 기대 출력은 공개하지 않습니다.`,
          },
        }, { headers: { "Cache-Control": "no-store" } });
      }
    }

    return Response.json({ ok: true, result: { status: "accepted", label: "정답", action: "submit", passed: cases.length, total: cases.length, confirmed: `공개·비공개 테스트 ${cases.length}개를 모두 통과했습니다.` } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "알 수 없는 Sandbox 오류";
    console.error("[al2beat:execute]", requestId, detail);
    return errorResponse(503, "SANDBOX_UNAVAILABLE", "격리 실행 환경을 시작하지 못했습니다. 무료 한도 소진 또는 일시 장애일 수 있으며, 저장된 코드는 유지됩니다.", requestId, true);
  } finally {
    await sandbox?.stop().catch(() => undefined);
  }
}
