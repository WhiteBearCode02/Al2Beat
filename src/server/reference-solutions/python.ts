import type { ReferenceSolutionSet } from "./types.ts";
import { expandedPythonSolutions } from "./expanded/python.ts";

export const pythonSolutions = {
  ...expandedPythonSolutions,
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
  deque: String.raw`import sys
from collections import deque

input = sys.stdin.readline
values = deque()
for _ in range(int(input())):
    command = input().split()
    if command[0] == 'LF':
        values.appendleft(int(command[1]))
    elif command[0] == 'LB':
        values.append(int(command[1]))
    elif command[0] == 'PF':
        if values:
            values.popleft()
    elif values:
        values.pop()
print(*values) if values else print('EMPTY')`,
  "linked-list": String.raw`import sys

input = sys.stdin.readline
left = list(input().strip())
right = []
for _ in range(int(input())):
    command = input().split()
    if command[0] == 'L':
        if left:
            right.append(left.pop())
    elif command[0] == 'R':
        if right:
            left.append(right.pop())
    elif command[0] == 'D':
        if left:
            left.pop()
    else:
        left.append(command[1])
print(''.join(left + right[::-1]))`,
  "min-heap": String.raw`import sys
import heapq

input = sys.stdin.readline
heap = []
answer = []
for _ in range(int(input())):
    command = input().split()
    if command[0] == 'P':
        heapq.heappush(heap, int(command[1]))
    else:
        answer.append(str(heapq.heappop(heap)) if heap else 'EMPTY')
print('\n'.join(answer))`,
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
  "union-find": String.raw`import sys

input = sys.stdin.readline
n, q = map(int, input().split())
parent = list(range(n + 1))
size = [1] * (n + 1)

def find(node):
    root = node
    while parent[root] != root:
        root = parent[root]
    while parent[node] != node:
        next_node = parent[node]
        parent[node] = root
        node = next_node
    return root

answer = []
for _ in range(q):
    command, a, b = input().split()
    a, b = int(a), int(b)
    root_a, root_b = find(a), find(b)
    if command == 'Q':
        answer.append('YES' if root_a == root_b else 'NO')
    elif root_a != root_b:
        if size[root_a] < size[root_b]:
            root_a, root_b = root_b, root_a
        parent[root_b] = root_a
        size[root_a] += size[root_b]
print('\n'.join(answer))`,
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
