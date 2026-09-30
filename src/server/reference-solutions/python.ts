import type { ReferenceSolutionSet } from "./types.ts";

export const pythonSolutions = {
  stack: String.raw`import sys
s = sys.stdin.readline().strip()
stack = []
pairs = {')': '(', ']': '[', '}': '{'}
for ch in s:
    if ch in '([{':
        stack.append(ch)
    elif not stack or stack.pop() != pairs[ch]:
        print('NO')
        break
else:
    print('NO' if stack else 'YES')`,
  queue: String.raw`import sys
from collections import deque

k, n = map(int, sys.stdin.readline().split())
queue = deque()
for command in map(int, sys.stdin.readline().split()):
    if command == 0:
        if queue:
            queue.popleft()
    elif len(queue) < k:
        queue.append(command)
print(*queue) if queue else print('EMPTY')`,
  "hash-map": String.raw`import sys

input = sys.stdin.readline
counts = {}
for _ in range(int(input())):
    name = input().strip()
    counts[name] = counts.get(name, 0) + 1
name, count = min(counts.items(), key=lambda item: (-item[1], item[0]))
print(name, count)`,
  "binary-search": String.raw`import sys

n, target = map(int, sys.stdin.readline().split())
scores = list(map(int, sys.stdin.readline().split()))
left, right = 0, n
while left < right:
    mid = (left + right) // 2
    if scores[mid] < target:
        left = mid + 1
    else:
        right = mid
print(left + 1 if left < n else -1)`,
  "merge-sort": String.raw`import sys

input = sys.stdin.readline
people = [input().split() for _ in range(int(input()))]
people.sort(key=lambda item: int(item[0]))
print('\n'.join(f'{score} {name}' for score, name in people))`,
  bfs: String.raw`import sys
from collections import deque

input = sys.stdin.readline
h, w = map(int, input().split())
grid = [input().strip() for _ in range(h)]
distance = [[-1] * w for _ in range(h)]
distance[0][0] = 1
queue = deque([(0, 0)])
while queue:
    y, x = queue.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and grid[ny][nx] == '0' and distance[ny][nx] == -1:
            distance[ny][nx] = distance[y][x] + 1
            queue.append((ny, nx))
print(distance[h - 1][w - 1])`,
  dfs: String.raw`import sys

input = sys.stdin.readline
vertex_count, edge_count = map(int, input().split())
graph = [[] for _ in range(vertex_count + 1)]
for _ in range(edge_count):
    a, b = map(int, input().split())
    graph[a].append(b)
    graph[b].append(a)
seen = [False] * (vertex_count + 1)
answer = 0
for start in range(1, vertex_count + 1):
    if seen[start]:
        continue
    answer += 1
    seen[start] = True
    stack = [start]
    while stack:
        node = stack.pop()
        for next_node in graph[node]:
            if not seen[next_node]:
                seen[next_node] = True
                stack.append(next_node)
print(answer)`,
  "basic-dp": String.raw`import sys

n = int(sys.stdin.readline())
cost = list(map(int, sys.stdin.readline().split()))
if n == 1:
    print(cost[0])
else:
    previous_two, previous_one = cost[0], cost[1]
    for value in cost[2:]:
        previous_two, previous_one = previous_one, min(previous_two, previous_one) + value
    print(previous_one)`,
} satisfies ReferenceSolutionSet;
