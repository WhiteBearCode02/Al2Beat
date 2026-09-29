# al2beat 기술 결정 기록

기준일: 2026-09-29 (Asia/Seoul)

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

컨테이너 이미지 크기, Sandbox 생성 시간, 다섯 언어 컴파일/실행, 네트워크 차단, CPU·메모리 제한, 월 무료 사용량 소비는 Vercel 자격 증명과 연결 프로젝트가 없어 미측정이다. 로컬 Java/C# 실행은 우리가 작성한 고정된 프로브만 사용했으며 사용자 코드는 일반 서버나 Function에서 실행하지 않았다.

## 실행/채점 결정

2026-09-30에 Python 실행·채점과 C, C++, Java, C#용 공통 Sandbox 실행 어댑터를 구현했다. 다국어 스냅샷을 실측·연결하기 전에는 네 언어를 편집 전용으로 표시한다.

- `@vercel/sandbox` 3.5.1의 Python 3.14 managed image를 사용한다. 요청마다 비영속 Firecracker microVM을 만들고 생성 시 `networkPolicy: "deny-all"`을 적용한다.
- 공개 예제와 직접 입력은 Pyodide 3.14를 전용 Web Worker에서 실행한다. 정적 런타임은 패키지 잠금 파일에 고정하고 빌드 전에 앱의 `/public/vendor/pyodide`로 준비하므로 외부 CDN을 사용하지 않는다. 3초가 지나면 Worker를 종료하고, 출력은 64KB로 제한한다.
- C/C++/Java/C#은 GCC, Amazon Corretto/OpenJDK 21, .NET SDK 8을 설치한 단일 Sandbox 스냅샷을 사용한다. 생성 시 `dnf`와 `apt-get`을 감지해 현재 공식 베이스 이미지 차이를 흡수하고 각 버전 명령이 성공해야만 스냅샷을 저장한다. 사용자 코드가 전달되기 전에 네트워크 정책을 `deny-all`로 바꾸며, 런타임 요청도 다시 `deny-all`을 지정한다.
- C/C++와 Python은 256MB 가상 메모리 제한을 적용한다. Java는 `-Xmx256m`, C#은 `DOTNET_GCHeapHardLimit=0x10000000`으로 관리 힙을 제한한다. JVM/.NET의 전체 네이티브 메모리까지 256MB라고 주장하지 않으며 microVM 자체는 1 vCPU 기본 메모리 경계를 추가로 가진다.
- 스냅샷 생성은 무료 한도를 소비할 수 있어 자동 수행하지 않는다. 확인 환경 변수와 Vercel 인증이 모두 있어야 생성 스크립트가 동작하며, 실제 ID가 없으면 해당 언어를 편집 전용으로 표시한다.
- `/api/capabilities`는 Python `run: true`를 항상 반환한다. 각 언어의 서버 `run`과 `judge`는 인증 및 필요한 스냅샷이 확인될 때만 `true`를 반환한다.
- `/api/execute`는 Zod와 UTF-8 바이트 수로 입력을 검증하고, 중복 키와 최선 노력 방식의 인스턴스별 빈도 제한을 적용한다. 실행은 3초, C/C++/Python 가상 메모리와 Java/C# 관리 힙은 256MB, 출력은 64KB로 제한한다.
- 서버 전용 테스트의 입력·기대 출력은 UI, 공개 JSON, 피드백, 일반 로그에 쓰지 않는다.
- 예제 실행과 제출을 분리한다. 공개 실패만 입력·기대·실제 출력 차이를 표시하고 비공개 실패는 작성된 테스트 범주만 알린다.
- Monaco를 코드 실행이라고 부르지 않는다. 미검증 언어의 실행 버튼은 비활성화한다.
- 현재 로컬 환경에는 Vercel 인증이 없어 실제 Sandbox 생성 왕복과 사용량은 아직 미실측이다. 서버 제출은 인증·무료 한도·서비스 장애 시에만 `시스템 장애`로 표시하며 코드는 IndexedDB에 유지한다. 공개 배포 전 OIDC 환경에서 실행, 네트워크 차단, 시간·메모리·출력 제한을 다시 실측해야 한다.

## 콘텐츠와 영상 결정

- 외부 문제·해설·영상·자막·이미지·음원·사전 문장을 수집하거나 복사하지 않았다.
- 영상 경험은 MP4를 가장한 정적 미디어가 아니라 `content/concepts.json`의 6개 장면을 48초 동안 재생하는 자체 제작 인터랙티브 모션 설명이다. 재생/정지, 탐색, 0.75–1.5배속, 자막, 전체 대본을 지원한다.
- 모션은 의도적으로 무음이며 자동 효과음을 내지 않는다. OS의 `prefers-reduced-motion`을 존중한다.
- 장면 원본·자막·대본은 JSON, 제작 의도와 컷 구성은 `content/storyboards/README.md`에 둔다.

## 알려진 제한

- 다섯 언어의 실행·제출 코드는 구현됐지만 Vercel 인증 환경에서의 다국어 스냅샷 생성과 종단 실측은 아직 완료되지 않았다. 실측 전에는 C/C++/Java/C# 실행을 활성화하지 않는다. 에디터·저장·다운로드·문제·영상·사전 흐름은 동작한다.
- IndexedDB는 브라우저 저장 공간 정책의 영향을 받는다. 저장 성공 표시 후에도 사용자가 사이트 데이터를 지우면 복구할 수 없다.
- 인메모리 빈도 제한은 서버리스 인스턴스 전체에서 강한 전역 제한이 아니다. 실행 활성화 전에 Vercel WAF 규칙 또는 무료 범위에서 검증된 공유 제한 장치가 필요하다.
- 소스의 CSP는 Monaco 로컬 worker를 위해 `blob:` worker와 개발/번들 동작을 위한 제한적 `unsafe-eval`을 허용한다. 외부 연결은 `connect-src 'self'`로 막는다.
