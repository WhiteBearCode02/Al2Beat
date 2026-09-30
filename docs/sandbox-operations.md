# Sandbox 비용·사용량 운영 가이드

기준일: 2026-09-30

## 결론

Vercel Hobby에서 프로젝트 전체의 월간 Sandbox 잔여량을 원자적으로 읽고 차감하는 무료 API는 확인하지 못했습니다. Runtime Cache는 리전별 임시 캐시이고 원자적 카운터가 아니며, WAF의 속도 제한도 리전별 IP/JA4 기준이므로 전역 월간 사용량 선차단으로 간주하지 않습니다.

al2beat는 이 한계를 숨기지 않고 서버 Sandbox 실행을 기본 차단합니다. 아래 두 환경 변수가 모두 유효할 때만 실행하며, 임대 시각이 지나거나 24시간을 초과하면 `/api/execute`가 Sandbox를 만들기 전에 `EXECUTION_GUARD_DISABLED`로 종료합니다.

```dotenv
AL2BEAT_PUBLIC_EXECUTION_ENABLED=ENABLE_HOBBY_SANDBOX
AL2BEAT_EXECUTION_LEASE_EXPIRES_AT=2026-09-30T15:00:00.000Z
```

임대는 현재 시각부터 최대 24시간입니다. 연장하려면 Hobby 대시보드에서 실제 사용량을 먼저 확인하고 새 만료 시각으로 배포해야 합니다. 임대가 닫혀도 Python 브라우저 예제 실행, 코드 편집, IndexedDB 저장, JSON 백업, 정답 보기는 유지됩니다.

## 보조 제한

- 애플리케이션은 IP별 실행 10회/분, 제출 3회/분을 최선 노력 방식으로 제한합니다.
- Vercel WAF는 `/api/execute`의 과도한 단일 출처 요청을 줄이는 보조 수단으로만 사용합니다.
- Hobby WAF 규칙은 한 개뿐일 수 있고 카운터가 리전별이므로, 기존 규칙을 확인한 뒤 Log 모드로 관찰하고 사용자가 직접 게시해야 합니다.
- WAF 설정이나 게시를 자동화하지 않습니다. 기존 보안 정책을 덮어쓸 수 있기 때문입니다.

## 정밀 실측

`sandbox:measure`는 기존 도구 모음 스냅샷 한 개와 Python 관리형 이미지로 Sandbox를 각각 한 번 생성합니다. 두 Sandbox 모두 생성 시 네트워크가 `deny-all`이며 비밀값을 내부 환경에 전달하지 않습니다.

측정 항목:

- 도구 모음 Snapshot의 SDK 보고 크기
- Sandbox 생성 요청부터 준비 완료까지 걸린 시간
- 언어별 새 프로세스 5회의 시작~종료 시간과 p95
- `/usr/bin/time -v`가 보고하는 언어 프로세스의 최대 RSS
- 컴파일 시간, 결과물 크기
- 세션의 active CPU 시간, 프로비저닝 메모리, 네트워크 전송량

관리형 Python 이미지의 내부 이미지 크기는 SDK가 제공하지 않으므로 `null`과 불확실성으로 기록합니다. 최대 RSS는 microVM 전체 실제 메모리가 아니라 해당 언어 프로세스의 피크 값입니다.

실제 실행은 Hobby 포함량을 사용하므로 사전 동의 후에만 다음 확인 토큰을 일회성으로 설정합니다.

```powershell
$env:AL2BEAT_CONFIRM_SANDBOX_USAGE="MEASURE_RUNTIME_RESOURCES"
npm run sandbox:measure
```

결과는 `docs/measurements/sandbox-runtime-YYYY-MM-DD.json`에 저장됩니다. 스냅샷 ID는 축약되어 기록됩니다.
