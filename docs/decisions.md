# al2beat 기술 결정 기록

기준일: 2026-09-30 (Asia/Seoul)

## 0단계 — 저장소와 제품 범위

- 저장소는 `.git`만 있는 새 저장소였고 기존 커밋·미커밋 파일·`AGENTS.md`·`algorithm-learning-platform-plan.md`는 없었다.
- 가입과 서버 DB 없이 시작하며 코드, 사용자 입력, 진도, 북마크, 설정은 IndexedDB `al2beat` v1에 저장한다.
- 브라우저 데이터 삭제나 기기 변경 시 기록이 사라질 수 있음을 화면에 상시 알리고, 버전이 붙은 JSON 내보내기/가져오기를 제공한다.
- 공개 콘텐츠는 `content/concepts.json`과 `content/glossary.json`에 둔다. 비공개 테스트는 `src/server/private-tests.ts`에 두고 클라이언트 코드에서 가져오지 않는다.
- 자체 작성 기준 풀이는 `src/server/reference-solutions.ts`에 두고 확인 안내 이후 공개 API로 요청한다. 이는 공개 학습 콘텐츠이며 비공개 테스트 입력·기대 출력과 연결하지 않는다.

## Vercel Hobby와 Sandbox 조사

공식 문서 확인 결과:

- Hobby는 개인·비상업 용도로만 쓸 수 있다. 이 프로젝트의 실제 운영 목적이 그 조건을 만족하는지는 배포 계정 소유자가 확인해야 한다. 광고·결제·판매·유료 제작물이 되면 Hobby를 사용하지 않는다.
- Hobby 무료 한도 초과 시 일반적으로 기능이 일시 중단되고 추가 사용료는 청구되지 않는다. Sandbox는 한도 초과 후 생성이 중지되며 최초 사용 후 30일이 지나야 재개된다.
- 2026-09-10 기준 Sandbox Hobby 포함량은 Active CPU 5시간/월, Provisioned Memory 420 GB-hours/월, 생성 5,000회/월, 데이터 전송 20GB/월, 스냅샷·드라이브 저장 15GB, 최대 세션 45분, 동시 Sandbox 10개다.
- Sandbox의 기본 네트워크 정책은 `allow-all`이다. 사용자 코드를 실행할 때는 생성 시점부터 `networkPolicy: "deny-all"`을 적용해야 DNS를 포함한 외부 연결을 막을 수 있다.
- Hobby에 포함된 한도와 일시 중단은 비용 0원 요구에 맞지만, 애플리케이션에서 계정 전체의 잔여 Sandbox 사용량을 신뢰성 있게 선차단하는 구현과 다섯 언어 이미지 실측을 이번 환경에서 검증하지 못했다.

공식 근거:

- <https://vercel.com/docs/plans/hobby>
- <https://vercel.com/docs/limits/fair-use-guidelines>
- <https://vercel.com/legal/terms>
- <https://vercel.com/docs/sandbox/pricing>
- <https://vercel.com/docs/sandbox/concepts/firewall>

이 기록은 법률 자문이 아니며 권리·약관 위험이 0이라고 보증하지 않는다. Vercel 문서와 약관은 변경될 수 있으므로 공개 전 다시 확인한다.

## 다섯 언어 프로토타입

실험 원본은 `experiments/runtime-prototype/`에 있다. 출력이 `42`인 최소 프로그램을 사용했다. 측정은 이 Windows 개발 머신에서 수행했으며 격리 Sandbox 수치가 아니다. 시작 시간은 프로세스 생성부터 종료까지이며, 피크 메모리는 2ms 간격 표본이라 실제 최대값보다 낮을 수 있다.

| 언어 | 발견 버전 | 컴파일 | 실행 5회 평균 | 피크 작업 집합 평균 | 산출물 | 판정 |
|---|---:|---:|---:|---:|---:|---|
| C | 설치 안 됨 | 미측정 | 미측정 | 미측정 | 미측정 | 편집만 |
| C++ | 설치 안 됨 | 미측정 | 미측정 | 미측정 | 미측정 | 편집만 |
| Java | Zulu OpenJDK 17.0.19 | 397.76ms | 108.12ms | 36.11MB | `Hello.class` 406B | 로컬 확인, 공개 실행 불가 |
| Python | 설치 안 됨 | 해당 없음 | 미측정 | 미측정 | 해당 없음 | 편집만 |
| C# | .NET SDK 7.0.101 | 첫 빌드 2.75s | 97.63ms | 18.65MB | DLL 5,120B | 로컬 확인, 공개 실행 불가 |

위 표는 최초 로컬 조사 기록이다. 이후 인증된 Vercel Hobby 환경에서 아래 Sandbox 운영 검증을 별도로 수행했다. 로컬 Java/C# 실행은 우리가 작성한 고정된 프로브만 사용했으며 사용자 코드는 일반 서버나 Function에서 실행하지 않았다.

### 2026-09-30 Vercel Sandbox 운영 검증

- 프로젝트 `al2-beat`가 Hobby 플랜임을 CLI에서 확인했다. `vercel usage --json`은 활성 구독의 비용 데이터가 없다고 응답해 세부 잔여량은 측정하지 못했다.
- OIDC로 `iad1`에 도구 모음 스냅샷을 한 번 생성했다. CLI 기준 생성·설치·버전 확인·스냅샷 완료까지 약 31초가 걸렸다.
- 실측 버전은 GCC/G++ 11.5.0, OpenJDK/Javac 21.0.12, .NET SDK 8.0.129다.
- 최초 실행기는 `hnd1`로 고정되어 `snapshot is available in iad1` 오류가 발생했다. 생성기와 실행기의 기본 지역을 `iad1`로 통일하고 `AL2BEAT_SANDBOX_REGION`으로 선택 가능하게 수정했다.
- C, C++, Java, C#으로 스택 문제를 운영 API에 제출했고 각 언어가 공개·비공개 테스트 4/4를 통과했다. C#은 로컬 OIDC 종단 검증과 운영 배포 검증을 모두 통과했다.
- C# 고정 프로브의 오프라인 빌드는 2.88초, 최대 프로젝트 산출물은 apphost 89,392바이트였고 실행 출력 `OK`, 종료 코드 0을 확인했다.
- 네트워크 `deny-all` 상태에서 NuGet DNS 조회가 실패하는 것을 관찰했다. C#은 패키지 소스를 비운 `NuGet.Config`로 오프라인 복원한 뒤 `--no-restore` 빌드를 수행한다.
- 이미지 전체 크기, 언어별 Sandbox 시작 시간, JVM/.NET 네이티브 메모리 피크는 아직 정밀 측정하지 않았다.

## 실행/채점 결정

2026-09-30에 Python 실행·채점과 C, C++, Java, C#용 공통 Sandbox 실행 어댑터를 구현했다. 다국어 스냅샷을 실측·연결하기 전에는 네 언어를 편집 전용으로 표시한다.

- `@vercel/sandbox` 3.5.1의 Python 3.14 managed image를 사용한다. 요청마다 비영속 Firecracker microVM을 만들고 생성 시 `networkPolicy: "deny-all"`을 적용한다.
- 공개 예제와 직접 입력은 Pyodide 3.14를 전용 Web Worker에서 실행한다. 정적 런타임은 패키지 잠금 파일에 고정하고 빌드 전에 앱의 `/public/vendor/pyodide`로 준비하므로 외부 CDN을 사용하지 않는다. 3초가 지나면 Worker를 종료하고, 출력은 64KB로 제한한다.
- C/C++/Java/C#은 GCC, Amazon Corretto/OpenJDK 21, .NET SDK 8을 설치한 단일 Sandbox 스냅샷을 사용한다. 생성 시 `dnf`와 `apt-get`을 감지해 현재 공식 베이스 이미지 차이를 흡수하고 각 버전 명령이 성공해야만 스냅샷을 저장한다. 사용자 코드가 전달되기 전에 네트워크 정책을 `deny-all`로 바꾸며, 런타임 요청도 다시 `deny-all`을 지정한다.
- C/C++와 Python은 256MB 가상 메모리 제한을 적용한다. Java는 `-Xmx256m`, C#은 `DOTNET_GCHeapHardLimit=0x10000000`으로 관리 힙을 제한한다. JVM/.NET의 전체 네이티브 메모리까지 256MB라고 주장하지 않으며 microVM 자체는 1 vCPU 기본 메모리 경계를 추가로 가진다.
- stdout/stderr는 프로세스 치환 파이프로 각각 64KB+1바이트까지만 기록한 뒤 초과 여부를 판정한다. C/C++/Java는 컴파일 산출물에 16MB 파일 상한을 둔다. .NET 런타임은 작은 `RLIMIT_FSIZE`에서 시작하지 못해 C#의 파일 상한은 적용하지 않지만, 소스·입력·시간·관리 힙·출력·네트워크·요청 빈도 제한과 비영속 microVM 격리는 그대로 적용한다.
- 스냅샷 생성은 무료 한도를 소비할 수 있어 자동 수행하지 않는다. 확인 환경 변수와 Vercel 인증이 모두 있어야 생성 스크립트가 동작하며, 실제 ID가 없으면 해당 언어를 편집 전용으로 표시한다.
- `/api/capabilities`는 Python 브라우저 실행을 위해 `run: true`를 항상 반환한다. 각 언어의 서버 `run`과 `judge`는 실행 임대, 인증, 필요한 스냅샷이 모두 확인될 때만 `true`를 반환한다.
- `/api/execute`는 Zod와 UTF-8 바이트 수로 입력을 검증하고, 중복 키와 최선 노력 방식의 인스턴스별 빈도 제한을 적용한다. 실행은 3초, C/C++/Python 가상 메모리와 Java/C# 관리 힙은 256MB, 출력은 64KB로 제한한다.
- 서버 전용 테스트의 입력·기대 출력은 UI, 공개 JSON, 피드백, 일반 로그에 쓰지 않는다.
- 예제 실행과 제출을 분리한다. 공개 실패만 입력·기대·실제 출력 차이를 표시하고 비공개 실패는 작성된 테스트 범주만 알린다.
- Monaco를 코드 실행이라고 부르지 않는다. 미검증 언어의 실행 버튼은 비활성화한다.
- 운영 프로젝트에는 스냅샷 ID를 Production Secret 환경 변수로 저장했다. 서버 제출은 인증·스냅샷 만료·무료 한도·서비스 장애 시 `시스템 장애`로 표시하며 코드는 IndexedDB에 유지한다.

## 콘텐츠와 영상 결정

- 외부 문제·해설·영상·자막·이미지·음원·사전 문장을 수집하거나 복사하지 않았다.
- 영상 경험은 MP4를 가장한 정적 미디어가 아니라 `content/concepts.json`의 6개 장면을 48초 동안 재생하는 자체 제작 인터랙티브 모션 설명이다. 재생/정지, 탐색, 0.75–1.5배속, 자막, 전체 대본을 지원한다.
- 모션은 의도적으로 무음이며 자동 효과음을 내지 않는다. OS의 `prefers-reduced-motion`을 존중한다.
- 장면 원본·자막·대본은 JSON, 제작 의도와 컷 구성은 `content/storyboards/README.md`에 둔다.

## 알려진 제한

- 다섯 언어의 실행·제출과 다국어 스냅샷 운영 검증은 완료했다. 스냅샷 ID가 없는 환경에서는 C/C++/Java/C#을 편집 전용으로 표시한다. ID가 가리키는 스냅샷의 만료 여부는 기능 API가 생성 없이 확인하지 않으므로, 만료 시 실행은 시스템 장애로 중단되고 운영자가 새 ID로 교체해야 한다.
- IndexedDB는 브라우저 저장 공간 정책의 영향을 받는다. 저장 성공 표시 후에도 사용자가 사이트 데이터를 지우면 복구할 수 없다.
- 인메모리 빈도 제한은 서버리스 인스턴스 전체에서 강한 전역 제한이 아니다. 따라서 서버 실행은 기본 차단하고 최대 24시간의 명시적 실행 임대만 허용한다. WAF는 전역 사용량 카운터가 아니라 출처별 남용 완화 수단으로만 취급한다.
- 소스의 CSP는 Monaco 로컬 worker를 위해 `blob:` worker와 개발/번들 동작을 위한 제한적 `unsafe-eval`을 허용한다. 외부 연결은 `connect-src 'self'`로 막는다.

## 2026-09-30 전역 사용량 차단과 정밀 실측 결정

- Vercel Runtime Cache는 리전별 임시 저장소이며 원자적 전역 카운터가 아니다. Vercel WAF 속도 제한도 리전별 IP/JA4 기준이므로 프로젝트 전체의 월간 Sandbox 사용량 선차단으로 사용할 수 없다.
- Hobby에는 Spend Management를 적용할 수 없고, Sandbox 월간 잔여량을 애플리케이션에서 원자적으로 조회·예약하는 무료 API도 확인하지 못했다.
- 따라서 서버 Sandbox 실행은 기본적으로 닫는다. `AL2BEAT_PUBLIC_EXECUTION_ENABLED=ENABLE_HOBBY_SANDBOX`와 현재부터 최대 24시간 이내의 `AL2BEAT_EXECUTION_LEASE_EXPIRES_AT`이 함께 있을 때만 실행한다. 만료·누락·잘못된 시각·24시간 초과는 Sandbox 생성 전에 차단한다.
- 이 임대는 사용량 기반 자동 차감 장치가 아니다. 운영자가 대시보드 사용량을 확인하고 짧은 기간만 명시적으로 여는 fail-closed 대안이다. 임대가 닫혀도 브라우저 Python 실행과 모든 편집·저장 기능은 유지한다.
- WAF는 단일 출처 남용을 줄이는 보조 수단일 뿐이다. 기존 Hobby 규칙을 덮어쓸 위험이 있어 저장소에서 외부 WAF 설정을 게시하지 않았다.
- 정밀 실측 스크립트 `scripts/measure-sandbox-runtimes.mjs`를 추가했다. 확인 토큰이 없으면 즉시 종료하며, 실행 시 네트워크 차단 Sandbox 두 개(도구 모음 Snapshot 1개, Python 관리형 이미지 1개)만 만든다.
- 스크립트는 Snapshot 크기, Sandbox 준비 시간, 언어별 5회 프로세스 시작~종료 시간, 컴파일 시간, 결과물 크기, `/usr/bin/time -v` 최대 RSS, 세션 active CPU·프로비저닝 메모리·전송량을 기록한다.
- 관리형 Python 이미지 크기는 SDK가 제공하지 않으며, 최대 RSS는 microVM 전체 실사용량과 동일하지 않다. 이 불확실성을 결과에 그대로 남긴다.
- 실제 정밀 실측은 Hobby 포함량을 소비하므로 사용자 동의 전에는 실행하지 않았다.
