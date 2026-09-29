import "server-only";

import type { LanguageId } from "@/types/content";

const py = {
  stack: `import sys
s = sys.stdin.readline().strip()
stack = []
pairs = {')': '(', ']': '[', '}': '{'}
for ch in s:
    if ch in '([{': stack.append(ch)
    elif not stack or stack.pop() != pairs[ch]:
        print('NO'); break
else:
    print('NO' if stack else 'YES')`,
  queue: `import sys
from collections import deque
k, n = map(int, sys.stdin.readline().split())
q = deque()
for command in map(int, sys.stdin.readline().split()):
    if command == 0:
        if q: q.popleft()
    elif len(q) < k: q.append(command)
print(*q) if q else print('EMPTY')`,
  "hash-map": `import sys
input = sys.stdin.readline
counts = {}
for _ in range(int(input())):
    name = input().strip()
    counts[name] = counts.get(name, 0) + 1
name, count = min(counts.items(), key=lambda item: (-item[1], item[0]))
print(name, count)`,
  "binary-search": `import sys
n, x = map(int, sys.stdin.readline().split())
scores = list(map(int, sys.stdin.readline().split()))
left, right = 0, n
while left < right:
    mid = (left + right) // 2
    if scores[mid] < x: left = mid + 1
    else: right = mid
print(left + 1 if left < n else -1)`,
  "merge-sort": `import sys
input = sys.stdin.readline
people = [input().split() for _ in range(int(input()))]
people.sort(key=lambda item: int(item[0]))
print('\n'.join(f'{score} {name}' for score, name in people))`,
  bfs: `import sys
from collections import deque
input = sys.stdin.readline
h, w = map(int, input().split())
grid = [input().strip() for _ in range(h)]
dist = [[-1] * w for _ in range(h)]
dist[0][0] = 1
q = deque([(0, 0)])
while q:
    y, x = q.popleft()
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and grid[ny][nx] == '0' and dist[ny][nx] == -1:
            dist[ny][nx] = dist[y][x] + 1
            q.append((ny, nx))
print(dist[h-1][w-1])`,
  dfs: `import sys
input = sys.stdin.readline
v, e = map(int, input().split())
graph = [[] for _ in range(v + 1)]
for _ in range(e):
    a, b = map(int, input().split()); graph[a].append(b); graph[b].append(a)
seen = [False] * (v + 1)
answer = 0
for start in range(1, v + 1):
    if seen[start]: continue
    answer += 1; seen[start] = True; stack = [start]
    while stack:
        node = stack.pop()
        for nxt in graph[node]:
            if not seen[nxt]: seen[nxt] = True; stack.append(nxt)
print(answer)`,
  "basic-dp": `import sys
n = int(sys.stdin.readline())
cost = list(map(int, sys.stdin.readline().split()))
if n == 1: print(cost[0])
else:
    prev2, prev1 = cost[0], cost[1]
    for value in cost[2:]: prev2, prev1 = prev1, min(prev2, prev1) + value
    print(prev1)`,
} as const;

const cpp = {
  stack: `#include <bits/stdc++.h>
using namespace std;
int main(){ string s,t; cin>>s; map<char,char> p={{')','('},{']','['},{'}','{'}}; for(char c:s){ if(c=='('||c=='['||c=='{') t+=c; else if(t.empty()||t.back()!=p[c]){ cout<<"NO"; return 0; } else t.pop_back(); } cout<<(t.empty()?"YES":"NO"); }`,
  queue: `#include <bits/stdc++.h>
using namespace std;
int main(){ ios::sync_with_stdio(false);cin.tie(nullptr); int k,n,x;cin>>k>>n; deque<int> q; while(n--){cin>>x;if(x==0){if(!q.empty())q.pop_front();}else if((int)q.size()<k)q.push_back(x);} if(q.empty())cout<<"EMPTY";else for(int i=0;i<(int)q.size();i++)cout<<(i?" ":"")<<q[i]; }`,
  "hash-map": `#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;unordered_map<string,int> count;string s,best;int top=0;while(n--){cin>>s;int c=++count[s];if(c>top||(c==top&&(best.empty()||s<best))){top=c;best=s;}}cout<<best<<' '<<top;}`,
  "binary-search": `#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;long long x;cin>>n>>x;vector<long long>a(n);for(auto&v:a)cin>>v;auto it=lower_bound(a.begin(),a.end(),x);cout<<(it==a.end()?-1:int(it-a.begin())+1);}`,
  "merge-sort": `#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<pair<int,string>>a(n);for(auto&v:a)cin>>v.first>>v.second;stable_sort(a.begin(),a.end(),[](auto&a,auto&b){return a.first<b.first;});for(auto&[s,n]:a)cout<<s<<' '<<n<<'\n';}`,
  bfs: `#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int h,w;cin>>h>>w;vector<string>g(h);for(auto&s:g)cin>>s;vector<vector<int>>d(h,vector<int>(w,-1));queue<pair<int,int>>q;d[0][0]=1;q.push({0,0});int dy[]={1,-1,0,0},dx[]={0,0,1,-1};while(!q.empty()){auto[y,x]=q.front();q.pop();for(int k=0;k<4;k++){int ny=y+dy[k],nx=x+dx[k];if(ny>=0&&ny<h&&nx>=0&&nx<w&&g[ny][nx]=='0'&&d[ny][nx]<0){d[ny][nx]=d[y][x]+1;q.push({ny,nx});}}}cout<<d[h-1][w-1];}`,
  dfs: `#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int v,e,a,b;cin>>v>>e;vector<vector<int>>g(v+1);while(e--){cin>>a>>b;g[a].push_back(b);g[b].push_back(a);}vector<char>seen(v+1);int ans=0;for(int s=1;s<=v;s++)if(!seen[s]){ans++;stack<int>st;st.push(s);seen[s]=1;while(!st.empty()){int u=st.top();st.pop();for(int n:g[u])if(!seen[n])seen[n]=1,st.push(n);}}cout<<ans;}`,
  "basic-dp": `#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<long long>a(n);for(auto&v:a)cin>>v;if(n==1){cout<<a[0];return 0;}long long p2=a[0],p1=a[1];for(int i=2;i<n;i++){long long now=min(p2,p1)+a[i];p2=p1;p1=now;}cout<<p1;}`,
} as const;

export type SolutionConceptId = keyof typeof py;

const solutions: Partial<Record<LanguageId, Record<SolutionConceptId, string>>> = { python: py, cpp };

export function getReferenceSolution(conceptId: string, language: LanguageId) {
  return solutions[language]?.[conceptId as SolutionConceptId]?.trim();
}

export function hasReferenceSolution(conceptId: string, language: LanguageId) {
  return Boolean(getReferenceSolution(conceptId, language));
}
