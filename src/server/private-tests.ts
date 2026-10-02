import "server-only";

type HiddenCase = { input: string; expected: string; category: string };

function range(count: number, start = 1) {
  return Array.from({ length: count }, (_, index) => index + start);
}

function permutationOutput(values: number[], length: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const used = Array(sorted.length).fill(false);
  const path: number[] = [];
  const output: string[] = [];
  const search = () => {
    if (path.length === length) { output.push(path.join(" ")); return; }
    for (let index = 0; index < sorted.length; index++) {
      if (used[index]) continue;
      used[index] = true; path.push(sorted[index]); search(); path.pop(); used[index] = false;
    }
  };
  search();
  return output.join("\n");
}

function chainTreeInput(count: number, withKeys = false) {
  const lines = [String(count)];
  for (let node = 1; node <= count; node++) {
    const next = node === count ? 0 : node + 1;
    lines.push(withKeys ? `${node} 0 ${next}` : `0 ${next}`);
  }
  return lines.join("\n");
}

function chainGraphInput(count: number) {
  const lines = [`${count} ${count - 1} 1`];
  for (let node = 1; node < count; node++) lines.push(`${node} ${node + 1} 1`);
  return lines.join("\n");
}

const privateTests: Record<string, HiddenCase[]> = {
  stack: [
    { input: "()[]{}", expected: "YES", category: "연속된 올바른 괄호" },
    { input: "((", expected: "NO", category: "닫히지 않은 괄호" },
  ],
  queue: [
    { input: "1 4\n7 8 0 9", expected: "9", category: "용량 1과 초과 입력" },
    { input: "2 2\n0 0", expected: "EMPTY", category: "빈 큐에서 제거" },
  ],
  "hash-map": [
    { input: "4\nb\na\nb\na", expected: "a 2", category: "최빈값 동률" },
    { input: "1\nsolo", expected: "solo 1", category: "원소 하나" },
  ],
  deque: [
    { input: "4\nPF\nPB\nLF 9\nPB", expected: "EMPTY", category: "빈 덱 삭제와 마지막 원소 제거" },
    { input: "5\nLF 2\nLB 3\nLF 1\nPB\nPF", expected: "2", category: "양끝 연산 교차" },
  ],
  "linked-list": [
    { input: "a\n6\nL\nD\nD\nR\nI Z\nL", expected: "aZ", category: "문자열 양끝의 무효 명령" },
    { input: "abc\n5\nD\nD\nL\nD\nI X", expected: "Xa", category: "연속 삭제 뒤 맨 앞 삽입" },
  ],
  "min-heap": [
    { input: "5\nO\nP -2\nP -2\nO\nO", expected: "EMPTY\n-2\n-2", category: "빈 힙과 중복 음수" },
    { input: "4\nP 9\nP 1\nP 5\nO", expected: "1", category: "삽입 뒤 최소 루트" },
  ],
  "binary-search": [
    { input: "4 8\n1 2 3 4", expected: "-1", category: "조건을 만족하는 값 없음" },
    { input: "5 -3\n-3 -3 0 2 9", expected: "1", category: "첫 위치와 중복" },
  ],
  "merge-sort": [
    { input: "3\n1 first\n1 second\n1 third", expected: "1 first\n1 second\n1 third", category: "모든 키 동률의 안정성" },
  ],
  bfs: [
    { input: "1 1\n0", expected: "1", category: "시작과 도착이 같은 격자" },
    { input: "2 2\n01\n10", expected: "-1", category: "도달 불가" },
  ],
  dfs: [
    { input: "4 0", expected: "4", category: "간선 없는 정점" },
    { input: "3 3\n1 2\n2 3\n3 1", expected: "1", category: "순환 그래프" },
  ],
  "union-find": [
    { input: "3 5\nQ 1 1\nU 1 2\nU 1 2\nQ 2 1\nQ 2 3", expected: "YES\nYES\nNO", category: "자기 자신과 중복 합치기" },
    { input: "5 5\nU 1 2\nU 3 4\nU 2 3\nQ 1 4\nQ 1 5", expected: "YES\nNO", category: "여러 집합의 연쇄 합치기" },
  ],
  "basic-dp": [
    { input: "1\n7", expected: "7", category: "칸 하나" },
    { input: "4\n0 0 0 0", expected: "0", category: "비용 0" },
  ],
  "array-string": [
    { input: "a", expected: "a 1", category: "최소 길이" },
    { input: "aaaaaa", expected: "a 6", category: "한 구간" },
    { input: "abab", expected: "a 1\nb 1\na 1\nb 1", category: "매 문자 변경" },
    { input: "aaab", expected: "a 3\nb 1", category: "마지막 단일 구간" },
    { input: "abbba", expected: "a 1\nb 3\na 1", category: "같은 문자의 분리 구간" },
    { input: "zzzzaaaaz", expected: "z 4\na 4\nz 1", category: "양끝 중복 문자" },
    { input: "a".repeat(9_000), expected: "a 9000", category: "입력 한도 근처 선형 순회" },
  ],
  "prefix-sum": [
    { input: "1 1\n0\n1 1", expected: "0", category: "최소 입력과 0" },
    { input: "5 2\n1 2 3 4 5\n1 5\n3 3", expected: "15\n3", category: "전체와 단일 구간" },
    { input: "4 3\n-5 2 -1 8\n1 2\n2 4\n1 4", expected: "-3\n9\n4", category: "음수 누적" },
    { input: "3 2\n1000000000 1000000000 1000000000\n1 3\n2 3", expected: "3000000000\n2000000000", category: "64비트 합" },
    { input: "3 3\n0 0 0\n1 1\n1 3\n3 3", expected: "0\n0\n0", category: "중복 질의와 0" },
    { input: "2 2\n7 -7\n1 2\n2 2", expected: "0\n-7", category: "합 상쇄" },
    { input: `400 2\n${Array(400).fill("1").join(" ")}\n1 400\n201 400`, expected: "400\n200", category: "최대 원소 수 전처리" },
  ],
  "two-pointers": [
    { input: "2 0\n0 0", expected: "YES", category: "최소 입력과 중복" },
    { input: "2 5\n2 2", expected: "NO", category: "같은 위치 재사용 방지" },
    { input: "5 -2\n-8 -4 -1 2 9", expected: "YES", category: "음수 목표" },
    { input: "6 10\n1 2 4 6 8 9", expected: "YES", category: "가운데 쌍" },
    { input: "4 100\n1 2 3 4", expected: "NO", category: "범위 밖 목표" },
    { input: "5 6\n3 3 3 3 3", expected: "YES", category: "중복 값의 다른 위치" },
    { input: `800 1599\n${range(800).join(" ")}`, expected: "YES", category: "최대 원소 수 선형 탐색" },
  ],
  "sliding-window": [
    { input: "1 1\na", expected: "1", category: "최소 입력" },
    { input: "6 26\nabcdef", expected: "6", category: "모든 문자 허용" },
    { input: "8 2\nabacccab", expected: "5", category: "여러 최장 후보" },
    { input: "6 1\naabbaa", expected: "2", category: "한 종류 제한" },
    { input: "7 2\nabcbbbb", expected: "6", category: "왼쪽 반복 축소" },
    { input: "5 3\naaaaa", expected: "5", category: "중복 문자" },
    { input: `9000 2\n${"abc".repeat(3_000)}`, expected: "2", category: "입력 한도 근처 상각 선형 처리" },
  ],
  "recursion-backtracking": [
    { input: "1 1\n0", expected: "0", category: "최소 입력" },
    { input: "3 1\n3 1 2", expected: "1\n2\n3", category: "길이 1 정렬" },
    { input: "2 2\n-1 1", expected: "-1 1\n1 -1", category: "음수 포함" },
    { input: "3 3\n1 2 3", expected: permutationOutput([1, 2, 3], 3), category: "전체 길이 순열" },
    { input: "4 2\n10 -10 0 5", expected: permutationOutput([10, -10, 0, 5], 2), category: "입력 순서와 사전순" },
    { input: "4 3\n0 1 2 3", expected: permutationOutput([0, 1, 2, 3], 3), category: "0 포함 선택 복구" },
    { input: "8 2\n8 7 6 5 4 3 2 1", expected: permutationOutput(range(8), 2), category: "다수 가지 탐색" },
  ],
  greedy: [
    { input: "0", expected: "0", category: "금액 0" },
    { input: "1", expected: "1", category: "최소 양수" },
    { input: "4", expected: "4", category: "1원 반복" },
    { input: "555", expected: "3", category: "여러 단위 조합" },
    { input: "999", expected: "15", category: "각 단위 나머지" },
    { input: "1000", expected: "2", category: "같은 큰 동전 중복" },
    { input: "1000000000", expected: "2000000", category: "최대 금액" },
  ],
  "binary-tree": [
    { input: "1\n0 0", expected: "1", category: "루트 하나" },
    { input: "3\n2 3\n0 0\n0 0", expected: "2", category: "완전한 두 레벨" },
    { input: "4\n2 0\n3 0\n4 0\n0 0", expected: "4", category: "왼쪽 편향" },
    { input: "4\n0 2\n0 3\n0 4\n0 0", expected: "4", category: "오른쪽 편향" },
    { input: "5\n2 3\n4 5\n0 0\n0 0\n0 0", expected: "3", category: "너비가 다른 레벨" },
    { input: "6\n2 3\n0 4\n0 5\n0 0\n6 0\n0 0", expected: "4", category: "빈 자식 혼합" },
    { input: chainTreeInput(900), expected: "900", category: "최대 깊이 트리" },
  ],
  "binary-search-tree": [
    { input: "1\n0 0 0", expected: "YES", category: "노드 하나와 0 키" },
    { input: "3\n2 2 3\n1 0 0\n3 0 0", expected: "YES", category: "기본 BST" },
    { input: "3\n5 2 3\n2 0 0\n4 0 0", expected: "NO", category: "조상 경계 위반" },
    { input: "2\n1 2 0\n1 0 0", expected: "NO", category: "중복 키" },
    { input: "3\n0 2 3\n-1000000000 0 0\n1000000000 0 0", expected: "YES", category: "키 경계값" },
    { input: "4\n10 2 3\n5 0 4\n20 0 0\n11 0 0", expected: "NO", category: "왼쪽 서브트리의 먼 위반" },
    { input: chainTreeInput(450, true), expected: "YES", category: "최대 깊이 편향 BST" },
  ],
  dijkstra: [
    { input: "1 0 1", expected: "0", category: "정점 하나" },
    { input: "3 1 1\n1 2 5", expected: "0 5 INF", category: "도달 불가 정점" },
    { input: "3 3 1\n1 2 10\n1 3 1\n3 2 1", expected: "0 2 1", category: "더 짧은 우회 경로" },
    { input: "3 3 1\n1 2 0\n2 3 0\n1 3 5", expected: "0 0 0", category: "가중치 0" },
    { input: "4 5 2\n2 1 7\n2 3 2\n3 4 2\n2 4 9\n1 4 1", expected: "7 0 2 4", category: "시작점이 1이 아님" },
    { input: "2 2 1\n1 2 9\n1 2 3", expected: "0 3", category: "평행 간선" },
    { input: chainGraphInput(500), expected: range(500, 0).join(" "), category: "간선 한도 근처 연쇄 완화" },
  ],
  "topological-sort": [
    { input: "1 0", expected: "1", category: "작업 하나" },
    { input: "5 0", expected: "1 2 3 4 5", category: "간선 없음" },
    { input: "4 3\n1 4\n2 4\n3 4", expected: "1 2 3 4", category: "여러 선행 작업" },
    { input: "4 3\n4 3\n3 2\n2 1", expected: "4 3 2 1", category: "역번호 연쇄" },
    { input: "6 5\n1 4\n2 4\n2 5\n3 5\n4 6", expected: "1 2 3 4 5 6", category: "동시에 준비되는 작업" },
    { input: "4 2\n1 2\n1 3", expected: "1 2 3 4", category: "분리된 정점" },
    { input: `1000 0`, expected: range(1_000).join(" "), category: "다수 독립 작업과 최소 힙" },
  ],
  "knapsack-dp": [
    { input: "1 0\n1 10", expected: "0", category: "용량 0" },
    { input: "1 5\n5 7", expected: "7", category: "정확한 용량" },
    { input: "2 3\n4 100\n5 200", expected: "0", category: "모든 물건이 무거움" },
    { input: "3 6\n3 5\n3 5\n6 9", expected: "10", category: "서로 다른 중복 물건" },
    { input: "3 5\n2 0\n3 7\n5 6", expected: "7", category: "가치 0 포함" },
    { input: "4 10\n6 30\n3 14\n4 16\n2 9", expected: "46", category: "여러 조합 비교" },
    { input: `100 10000\n${Array.from({ length: 100 }, (_, index) => `${index + 1} ${index + 1}`).join("\n")}`, expected: "5050", category: "최대 물건 수와 큰 용량" },
  ],
};

export function getPrivateTests(problemId: string): HiddenCase[] {
  return privateTests[problemId] ?? [];
}
