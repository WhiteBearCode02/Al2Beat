# Third-Party Notices

기준일: 2026-09-29. 정확한 설치 버전은 `package-lock.json`이 최종 근거다. 아래 소프트웨어는 al2beat와 별개의 저작권 및 라이선스를 가진다. 배포 시 `node_modules` 안의 각 라이선스 원문과 잠금 파일의 전이 의존성도 함께 검토해야 한다.

| 패키지 | 버전 | 라이선스 | 용도 |
|---|---:|---|---|
| Next.js (`next`) | 16.3.6 | MIT | App Router, 빌드, Route Handler |
| React / React DOM | 19.3.0 | MIT | 사용자 인터페이스 |
| Monaco Editor | 0.57.0 | MIT | 코드 편집·문법 강조 |
| `@monaco-editor/react` | 4.7.0 | MIT | React용 Monaco 래퍼 |
| `idb` | 8.0.3 | ISC | IndexedDB Promise 래퍼 |
| Lucide React | 1.47.0 | ISC | 인터페이스 아이콘 |
| Zod | 4.6.5 | MIT | API 요청 스키마 검증 |
| `@vercel/sandbox` | 3.5.1 | Apache-2.0 | Python 사용자 코드의 격리 microVM 실행 |
| Pyodide (`pyodide`) | 314.0.7 | MPL-2.0 | 브라우저 전용 Python WebAssembly 런타임 |
| `server-only` | 0.0.1 | MIT | 서버 전용 테스트·실행 모듈의 클라이언트 import 방지 |
| TypeScript | 5.9.3 | Apache-2.0 | 정적 타입과 빌드 도구 |
| ESLint | 9.39.5 | MIT | 정적 분석 |
| `eslint-config-next` | 16.3.6 | MIT | Next.js 린트 규칙 |
| `@types/node`, `@types/react`, `@types/react-dom` | 잠금 파일 참조 | MIT | TypeScript 타입 선언 |

Monaco는 코드 실행기가 아니다. al2beat에서는 편집 및 문법 강조에만 사용한다.

버전과 라이선스 확인 출처:

- npm 패키지 메타데이터: <https://www.npmjs.com/package/next>, <https://www.npmjs.com/package/react>, <https://www.npmjs.com/package/monaco-editor>, <https://www.npmjs.com/package/%40monaco-editor/react>, <https://www.npmjs.com/package/idb>, <https://www.npmjs.com/package/lucide-react>, <https://www.npmjs.com/package/zod>, <https://www.npmjs.com/package/%40vercel/sandbox>, <https://www.npmjs.com/package/pyodide>, <https://www.npmjs.com/package/server-only>, <https://www.npmjs.com/package/typescript>
- Pyodide 라이선스 원문: <https://github.com/pyodide/pyodide/blob/main/LICENSE>
- 설치된 패키지별 라이선스 원문: 각 `node_modules/<package>/LICENSE*`

이 고지는 법률 자문이 아니며 권리 위험이 없음을 보증하지 않는다.
