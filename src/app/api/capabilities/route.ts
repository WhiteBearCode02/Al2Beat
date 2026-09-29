export const dynamic = "force-dynamic";

import { isSandboxSubmissionAvailable } from "../../../server/sandbox-runner.ts";

export async function GET() {
  const submissionAvailable = isSandboxSubmissionAvailable();
  return Response.json({
    ok: true,
    execution: {
      enabled: true,
      reason: submissionAvailable
        ? "Python 예제 실행은 이 브라우저에서, 서버 전용 제출 채점은 네트워크가 차단된 Vercel Sandbox microVM에서 처리합니다."
        : "Python 예제 실행은 이 브라우저에서 처리합니다. 이 환경은 Vercel Sandbox에 연결되지 않아 서버 전용 제출 채점은 비활성화됩니다.",
      languages: {
        c: { edit: true, run: false, judge: false, verifiedVersion: null },
        cpp: { edit: true, run: false, judge: false, verifiedVersion: null },
        java: { edit: true, run: false, judge: false, verifiedVersion: null },
        python: { edit: true, run: true, judge: submissionAvailable, verifiedVersion: "3.14 (Pyodide local runtime / Vercel managed image for submissions)" },
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
