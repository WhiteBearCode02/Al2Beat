import type { ReferenceSolutionSet } from "./types.ts";

export const cppSolutions = {
  stack: String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){string s;cin>>s;vector<char>st;map<char,char>p={{')','('},{']','['},{'}','{'}};for(char c:s){if(c=='('||c=='['||c=='{')st.push_back(c);else if(st.empty()||st.back()!=p[c]){cout<<"NO";return 0;}else st.pop_back();}cout<<(st.empty()?"YES":"NO");}`,
  queue: String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int k,n,x;cin>>k>>n;deque<int>q;while(n--){cin>>x;if(x==0){if(!q.empty())q.pop_front();}else if((int)q.size()<k)q.push_back(x);}if(q.empty())cout<<"EMPTY";else for(int i=0;i<(int)q.size();i++)cout<<(i?" ":"")<<q[i];}`,
  "hash-map": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n,top=0;string s,best;unordered_map<string,int>counts;cin>>n;while(n--){cin>>s;int count=++counts[s];if(count>top||(count==top&&(best.empty()||s<best))){top=count;best=s;}}cout<<best<<' '<<top;}`,
  "binary-search": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;long long target;cin>>n>>target;vector<long long>a(n);for(auto&v:a)cin>>v;auto it=lower_bound(a.begin(),a.end(),target);cout<<(it==a.end()?-1:(int)(it-a.begin())+1);}`,
  "merge-sort": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<pair<int,string>>a(n);for(auto&v:a)cin>>v.first>>v.second;stable_sort(a.begin(),a.end(),[](const auto&a,const auto&b){return a.first<b.first;});for(auto&[score,name]:a)cout<<score<<' '<<name<<'\n';}`,
  bfs: String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int h,w;cin>>h>>w;vector<string>g(h);for(auto&s:g)cin>>s;vector<vector<int>>d(h,vector<int>(w,-1));queue<pair<int,int>>q;d[0][0]=1;q.push({0,0});int dy[]={1,-1,0,0},dx[]={0,0,1,-1};while(!q.empty()){auto[y,x]=q.front();q.pop();for(int k=0;k<4;k++){int ny=y+dy[k],nx=x+dx[k];if(ny>=0&&ny<h&&nx>=0&&nx<w&&g[ny][nx]=='0'&&d[ny][nx]<0){d[ny][nx]=d[y][x]+1;q.push({ny,nx});}}}cout<<d[h-1][w-1];}`,
  dfs: String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int v,e,a,b;cin>>v>>e;vector<vector<int>>g(v+1);while(e--){cin>>a>>b;g[a].push_back(b);g[b].push_back(a);}vector<char>seen(v+1);int answer=0;for(int start=1;start<=v;start++)if(!seen[start]){answer++;stack<int>st;st.push(start);seen[start]=1;while(!st.empty()){int node=st.top();st.pop();for(int next:g[node])if(!seen[next]){seen[next]=1;st.push(next);}}}cout<<answer;}`,
  "basic-dp": String.raw`#include <bits/stdc++.h>
using namespace std;
int main(){ios::sync_with_stdio(false);cin.tie(nullptr);int n;cin>>n;vector<long long>a(n);for(auto&v:a)cin>>v;if(n==1){cout<<a[0];return 0;}long long p2=a[0],p1=a[1];for(int i=2;i<n;i++){long long now=min(p2,p1)+a[i];p2=p1;p1=now;}cout<<p1;}`,
} satisfies ReferenceSolutionSet;
