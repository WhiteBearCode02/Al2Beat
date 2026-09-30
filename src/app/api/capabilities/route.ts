export const dynamic = "force-dynamic";

import { languageCapabilities } from "../../../server/language-runtimes.ts";
import { getExecutionPolicy } from "../../../server/execution-policy.ts";

export async function GET() {
  const guard = getExecutionPolicy();
  const languages = {
    c: languageCapabilities("c"), cpp: languageCapabilities("cpp"), java: languageCapabilities("java"),
    python: languageCapabilities("python"), csharp: languageCapabilities("csharp"),
  };
  const serverLanguageCount = Object.values(languages).filter((item) => item.judge).length;
  return Response.json({
    ok: true,
    execution: {
      enabled: guard.enabled,
      guard,
      reason: !guard.enabled ? guard.reason : serverLanguageCount === 5
        ? "다섯 언어의 서버 실행·제출은 네트워크가 차단된 Vercel Sandbox에서 처리하며, Python 예제는 브라우저에서도 실행합니다."
        : "Python 예제는 브라우저에서 실행합니다. 다른 언어와 서버 제출은 Sandbox 인증 및 도구 모음 스냅샷이 연결되면 활성화됩니다.",
      languages,
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
