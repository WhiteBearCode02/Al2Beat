export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    execution: {
      enabled: false,
      reason: "Vercel Sandbox에서 다섯 언어의 격리·런타임·무료 한도 실측을 완료하지 않았습니다.",
      languages: {
        c: { edit: true, run: false, judge: false, verifiedVersion: null },
        cpp: { edit: true, run: false, judge: false, verifiedVersion: null },
        java: { edit: true, run: false, judge: false, verifiedVersion: null },
        python: { edit: true, run: false, judge: false, verifiedVersion: null },
        csharp: { edit: true, run: false, judge: false, verifiedVersion: null },
      },
      limits: {
        sourceBytes: 20_000,
        inputBytes: 10_000,
        outputBytes: 64_000,
        testsPerSubmission: 12,
        timeoutMs: 3_000,
        memoryMb: 256,
        concurrentPerClient: 1,
        runsPerMinute: 10,
        submissionsPerMinute: 3,
      },
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
