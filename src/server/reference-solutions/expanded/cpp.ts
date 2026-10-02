import type { ReferenceSolutionSet } from "../types.ts";

export const expandedCppSolutions = {
  "array-string": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);string s;cin>>s;int start=0;for(int i=1;i<=(int)s.size();++i)if(i==(int)s.size()||s[i]!=s[start]){cout<<s[start]<<' '<<i-start<<'\n';start=i;}}`,
  "prefix-sum": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,q;cin>>n>>q;vector<long long> p(n+1);for(int i=1;i<=n;++i){long long x;cin>>x;p[i]=p[i-1]+x;}while(q--){int l,r;cin>>l>>r;cout<<p[r]-p[l-1]<<'\n';}}`,
  "two-pointers": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;long long x;cin>>n>>x;vector<long long>a(n);for(auto&v:a)cin>>v;int l=0,r=n-1;while(l<r){long long s=a[l]+a[r];if(s==x){cout<<"YES";return 0;}s<x?++l:--r;}cout<<"NO";}`,
  "sliding-window": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,k;string s;cin>>n>>k>>s;array<int,26>c{};int l=0,kinds=0,answer=0;for(int r=0;r<n;++r){int x=s[r]-'a';if(c[x]++==0)++kinds;while(kinds>k){int y=s[l++]-'a';if(--c[y]==0)--kinds;}answer=max(answer,r-l+1);}cout<<answer;}`,
  "recursion-backtracking": String.raw`#include <bits/stdc++.h>
using namespace std;int n,r;vector<int>a,path;vector<char>used;
void search(){if((int)path.size()==r){for(int i=0;i<r;++i)cout<<path[i]<<(i+1==r?'\n':' ');return;}for(int i=0;i<n;++i)if(!used[i]){used[i]=1;path.push_back(a[i]);search();path.pop_back();used[i]=0;}}
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);cin>>n>>r;a.resize(n);used.assign(n,0);for(int&v:a)cin>>v;sort(a.begin(),a.end());search();}`,
  greedy: String.raw`#include <bits/stdc++.h>
using namespace std;int main(){long long amount,answer=0;cin>>amount;for(int coin:{500,100,50,10,5,1}){answer+=amount/coin;amount%=coin;}cout<<answer;}`,
  "binary-tree": String.raw`#include <bits/stdc++.h>
using namespace std;int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<array<int,2>>ch(n+1);for(int i=1;i<=n;++i)cin>>ch[i][0]>>ch[i][1];queue<int>q;q.push(1);int h=0;while(!q.empty()){++h;int size=q.size();while(size--){int u=q.front();q.pop();for(int v:ch[u])if(v)q.push(v);}}cout<<h;}`,
  "binary-search-tree": String.raw`#include <bits/stdc++.h>
using namespace std;struct Node{long long key;int left,right;};struct State{int node;long long low,high;};int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<Node>a(n+1);for(int i=1;i<=n;++i)cin>>a[i].key>>a[i].left>>a[i].right;vector<State>st={{1,LLONG_MIN,LLONG_MAX}};while(!st.empty()){auto [u,lo,hi]=st.back();st.pop_back();auto x=a[u];if(x.key<=lo||x.key>=hi){cout<<"NO";return 0;}if(x.left)st.push_back({x.left,lo,x.key});if(x.right)st.push_back({x.right,x.key,hi});}cout<<"YES";}`,
  dijkstra: String.raw`#include <bits/stdc++.h>
using namespace std;int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m,s;cin>>n>>m>>s;vector<vector<pair<int,int>>>g(n+1);while(m--){int u,v,w;cin>>u>>v>>w;g[u].push_back({v,w});}const long long INF=LLONG_MAX/4;vector<long long>d(n+1,INF);priority_queue<pair<long long,int>,vector<pair<long long,int>>,greater<pair<long long,int>>>q;d[s]=0;q.push({0,s});while(!q.empty()){auto [cost,u]=q.top();q.pop();if(cost!=d[u])continue;for(auto [v,w]:g[u])if(cost+w<d[v]){d[v]=cost+w;q.push({d[v],v});}}for(int i=1;i<=n;++i){if(i>1)cout<<' ';if(d[i]==INF)cout<<"INF";else cout<<d[i];}}`,
  "topological-sort": String.raw`#include <bits/stdc++.h>
using namespace std;int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,m;cin>>n>>m;vector<vector<int>>g(n+1);vector<int>deg(n+1);while(m--){int a,b;cin>>a>>b;g[a].push_back(b);++deg[b];}priority_queue<int,vector<int>,greater<int>>q;for(int i=1;i<=n;++i)if(!deg[i])q.push(i);bool first=true;while(!q.empty()){int u=q.top();q.pop();if(!first)cout<<' ';first=false;cout<<u;for(int v:g[u])if(--deg[v]==0)q.push(v);}}`,
  "knapsack-dp": String.raw`#include <bits/stdc++.h>
using namespace std;int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,w;cin>>n>>w;vector<long long>dp(w+1);while(n--){int weight;long long value;cin>>weight>>value;for(int c=w;c>=weight;--c)dp[c]=max(dp[c],dp[c-weight]+value);}cout<<dp[w];}`,
} satisfies Partial<ReferenceSolutionSet>;
