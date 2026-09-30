import "server-only";

export const EXECUTION_ENABLE_TOKEN = "ENABLE_HOBBY_SANDBOX";
export const MAX_EXECUTION_LEASE_MS = 24 * 60 * 60 * 1_000;

export type ExecutionPolicy = {
  enabled: boolean;
  code: "enabled" | "disabled" | "invalid-expiry" | "expired" | "lease-too-long";
  reason: string;
  expiresAt: string | null;
};

export function getExecutionPolicy(nowMs = Date.now()): ExecutionPolicy {
  const enabled = process.env.AL2BEAT_PUBLIC_EXECUTION_ENABLED?.trim();
  const expiresAt = process.env.AL2BEAT_EXECUTION_LEASE_EXPIRES_AT?.trim();

  if (enabled !== EXECUTION_ENABLE_TOKEN) {
    return {
      enabled: false,
      code: "disabled",
      reason: "서버 실행은 비용 보호 장치에 의해 닫혀 있습니다. Python 예제는 브라우저에서 계속 실행할 수 있습니다.",
      expiresAt: null,
    };
  }

  const expiryMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  if (!Number.isFinite(expiryMs)) {
    return {
      enabled: false,
      code: "invalid-expiry",
      reason: "서버 실행 임대 만료 시각이 없거나 올바른 ISO 8601 형식이 아닙니다.",
      expiresAt: expiresAt || null,
    };
  }
  if (expiryMs <= nowMs) {
    return {
      enabled: false,
      code: "expired",
      reason: "서버 실행 임대가 만료되어 Sandbox 생성을 자동 차단했습니다.",
      expiresAt: expiresAt ?? null,
    };
  }
  if (expiryMs - nowMs > MAX_EXECUTION_LEASE_MS) {
    return {
      enabled: false,
      code: "lease-too-long",
      reason: "서버 실행 임대는 최대 24시간까지만 열 수 있습니다.",
      expiresAt: expiresAt ?? null,
    };
  }

  return {
    enabled: true,
    code: "enabled",
    reason: "시간 제한 실행 임대가 활성화되어 있습니다. 만료되면 Sandbox 생성을 자동 차단합니다.",
    expiresAt: expiresAt ?? null,
  };
}
