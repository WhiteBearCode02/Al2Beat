import { z } from "zod";
import { PROBLEM_IDS } from "../../../../lib/problem-ids.ts";
import { getReferenceSolution } from "../../../../server/reference-solutions.ts";

const paramsSchema = z.object({ conceptId: z.enum(PROBLEM_IDS) });
const languageSchema = z.enum(["c", "cpp", "java", "python", "csharp"]);

export async function GET(request: Request, context: { params: Promise<{ conceptId: string }> }) {
  const params = paramsSchema.safeParse(await context.params);
  const language = languageSchema.safeParse(new URL(request.url).searchParams.get("language"));
  if (!params.success || !language.success) {
    return Response.json({ ok: false, error: { code: "INVALID_REQUEST", message: "문제 또는 언어를 확인해 주세요." } }, { status: 400 });
  }
  const source = getReferenceSolution(params.data.conceptId, language.data);
  if (!source) {
    return Response.json({ ok: false, error: { code: "SOLUTION_NOT_READY", message: "이 언어의 기준 풀이는 아직 준비 중입니다." } }, { status: 404 });
  }
  return Response.json({ ok: true, solution: { conceptId: params.data.conceptId, language: language.data, source } }, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
