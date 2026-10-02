import type { ReferenceSolutionSet } from "../types.ts";

export const expandedPythonSolutions = {
  "array-string": String.raw`import sys
s = sys.stdin.readline().strip()
start = 0
answer = []
for i in range(1, len(s) + 1):
    if i == len(s) or s[i] != s[start]:
        answer.append(f"{s[start]} {i - start}")
        start = i
print("\n".join(answer))`,
  "prefix-sum": String.raw`import sys
input = sys.stdin.readline
n, q = map(int, input().split())
prefix = [0]
for value in map(int, input().split()):
    prefix.append(prefix[-1] + value)
answer = []
for _ in range(q):
    left, right = map(int, input().split())
    answer.append(str(prefix[right] - prefix[left - 1]))
print("\n".join(answer))`,
  "two-pointers": String.raw`import sys
n, target = map(int, sys.stdin.readline().split())
values = list(map(int, sys.stdin.readline().split()))
left, right = 0, n - 1
while left < right:
    current = values[left] + values[right]
    if current == target:
        print("YES")
        break
    if current < target:
        left += 1
    else:
        right -= 1
else:
    print("NO")`,
  "sliding-window": String.raw`import sys
n, k = map(int, sys.stdin.readline().split())
s = sys.stdin.readline().strip()
counts = [0] * 26
left = kinds = answer = 0
for right, ch in enumerate(s):
    index = ord(ch) - 97
    if counts[index] == 0:
        kinds += 1
    counts[index] += 1
    while kinds > k:
        old = ord(s[left]) - 97
        counts[old] -= 1
        if counts[old] == 0:
            kinds -= 1
        left += 1
    answer = max(answer, right - left + 1)
print(answer)`,
  "recursion-backtracking": String.raw`import sys
n, r = map(int, sys.stdin.readline().split())
values = sorted(map(int, sys.stdin.readline().split()))
used = [False] * n
path = []
answer = []
def search():
    if len(path) == r:
        answer.append(" ".join(map(str, path)))
        return
    for i in range(n):
        if not used[i]:
            used[i] = True
            path.append(values[i])
            search()
            path.pop()
            used[i] = False
search()
print("\n".join(answer))`,
  greedy: String.raw`import sys
amount = int(sys.stdin.readline())
answer = 0
for coin in (500, 100, 50, 10, 5, 1):
    answer += amount // coin
    amount %= coin
print(answer)`,
  "binary-tree": String.raw`import sys
from collections import deque
input = sys.stdin.readline
n = int(input())
children = [(0, 0)] + [tuple(map(int, input().split())) for _ in range(n)]
queue = deque([1])
height = 0
while queue:
    height += 1
    for _ in range(len(queue)):
        node = queue.popleft()
        for child in children[node]:
            if child:
                queue.append(child)
print(height)`,
  "binary-search-tree": String.raw`import sys
input = sys.stdin.readline
n = int(input())
nodes = [None] + [tuple(map(int, input().split())) for _ in range(n)]
stack = [(1, -(1 << 63), 1 << 63)]
valid = True
while stack:
    node, low, high = stack.pop()
    key, left, right = nodes[node]
    if not low < key < high:
        valid = False
        break
    if left:
        stack.append((left, low, key))
    if right:
        stack.append((right, key, high))
print("YES" if valid else "NO")`,
  dijkstra: String.raw`import sys
import heapq
input = sys.stdin.readline
n, m, start = map(int, input().split())
graph = [[] for _ in range(n + 1)]
for _ in range(m):
    u, v, weight = map(int, input().split())
    graph[u].append((v, weight))
infinity = 10 ** 30
distance = [infinity] * (n + 1)
distance[start] = 0
queue = [(0, start)]
while queue:
    cost, node = heapq.heappop(queue)
    if cost != distance[node]:
        continue
    for next_node, weight in graph[node]:
        candidate = cost + weight
        if candidate < distance[next_node]:
            distance[next_node] = candidate
            heapq.heappush(queue, (candidate, next_node))
print(*("INF" if value == infinity else value for value in distance[1:]))`,
  "topological-sort": String.raw`import sys
import heapq
input = sys.stdin.readline
n, m = map(int, input().split())
graph = [[] for _ in range(n + 1)]
indegree = [0] * (n + 1)
for _ in range(m):
    before, after = map(int, input().split())
    graph[before].append(after)
    indegree[after] += 1
queue = [node for node in range(1, n + 1) if indegree[node] == 0]
heapq.heapify(queue)
answer = []
while queue:
    node = heapq.heappop(queue)
    answer.append(node)
    for next_node in graph[node]:
        indegree[next_node] -= 1
        if indegree[next_node] == 0:
            heapq.heappush(queue, next_node)
print(*answer)`,
  "knapsack-dp": String.raw`import sys
input = sys.stdin.readline
n, capacity = map(int, input().split())
dp = [0] * (capacity + 1)
for _ in range(n):
    weight, value = map(int, input().split())
    for current in range(capacity, weight - 1, -1):
        dp[current] = max(dp[current], dp[current - weight] + value)
print(dp[capacity])`,
} satisfies Partial<ReferenceSolutionSet>;
