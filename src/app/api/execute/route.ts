import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  if (previous && now - previous < 60_000) return errorResponse(409, "DUPLICATE_REQUEST", "같은 요청이 이미 접수되었습니다.", requestId);
  recent.set(duplicateKey, now);
  for (const [key, timestamp] of recent) if (now - timestamp > 60_000) recent.delete(key);

  return errorResponse(
    503,
    "EXECUTION_DISABLED",
    "격리 실행의 다섯 언어 실측과 운영 한도 검증이 완료되지 않아 안전 모드가 적용 중입니다. 코드는 브라우저에 유지됩니다.",
    requestId,
    true,
  );
}
