# al2beat

알고리즘을 속도 경쟁이 아닌 모션 설명 → 직접 작성 문제 → 코드 연습 → 복습의 트랙으로 배우는 개인 학습 사이트입니다.

## 현재 제공 범위

- 완성 콘텐츠 8개: 스택, 큐, 해시맵, 이진 탐색, 병합 정렬, BFS, DFS, 기초 DP
- 자체 제작 48초 인터랙티브 모션 설명 8개, 장면 48개, 자막·대본·0.75–1.5배속
- 자체 작성 문제 8개와 공개 예제, 서버 전용 경계 테스트
- 자체 작성 용어 52개: 한글·영문·약어·동의어 검색과 상세 설명
- Monaco에서 C, C++, Java, Python, C# 편집과 문제별·언어별 IndexedDB 자동 저장
- 진도, 체크포인트, 북마크, JSON 백업·복구, 코드 다운로드
- 반응형 모바일 영상/문제/용어 탭, 키보드 포커스, 동작 줄이기, 무음 모션, IDE 집중 모드

다섯 언어의 공개 실행과 채점은 현재 비활성화되어 있습니다. Vercel Sandbox 실측과 무료 한도 선차단을 검증하지 않은 상태에서 사용자 코드를 Function이나 앱 서버에서 실행하지 않기 위한 결정입니다. 자세한 근거는 [`docs/decisions.md`](docs/decisions.md)를 보세요.

## 로컬 실행

Node.js 24 이상을 사용합니다.

```bash
npm install
npm run dev
```

브라우저에서 <http://localhost:3000>을 엽니다.

## 검증

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 콘텐츠 편집

- 공개 학습 원본: `content/concepts.json`
- 용어 사전: `content/glossary.json`
- 모션 스토리보드: `content/storyboards/README.md`
- 비공개 테스트: `src/server/private-tests.ts` — 클라이언트에서 import 금지

## 데이터 보존

가입이나 서버 DB가 없습니다. 코드는 `al2beat` IndexedDB에 자동 저장되며, 사이트 데이터 삭제 또는 기기 변경 시 사라질 수 있습니다. 상단의 다운로드/업로드 버튼으로 JSON 백업을 만들고 복구하세요.

## 배포 조건

Vercel Hobby는 개인·비상업 사용에만 적용됩니다. 실제 사용 목적이 조건을 만족할 때만 기본 `vercel.app` 주소로 배포하고, 결제 수단 등록이나 유료 전환을 하지 마세요. 이 작업 환경에는 Vercel CLI 인증과 연결 프로젝트가 없어 배포하지 않았습니다.
