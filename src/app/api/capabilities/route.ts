export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    execution: {
      enabled: true,
      reason: "Python은 요청마다 네트워크가 차단된 Vercel Sandbox microVM에서 실행합니다. 나머지 언어는 런타임 실측 후 순차 지원합니다.",
      languages: {
        c: { edit: true, run: false, judge: false, verifiedVersion: null },
        cpp: { edit: true, run: false, judge: false, verifiedVersion: null },
        java: { edit: true, run: false, judge: false, verifiedVersion: null },
        python: { edit: true, run: true, judge: true, verifiedVersion: "3.14 (Vercel managed image)" },
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
