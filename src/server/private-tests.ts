import "server-only";

type HiddenCase = { input: string; expected: string; category: string };

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
};

export function getPrivateTests(problemId: string): HiddenCase[] {
  return privateTests[problemId] ?? [];
}
