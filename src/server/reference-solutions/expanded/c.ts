import type { ReferenceSolutionSet } from "../types.ts";

export const expandedCSolutions = {
  "array-string": String.raw`#include <stdio.h>
#include <string.h>
int main(void){static char s[200001];if(scanf("%200000s",s)!=1)return 0;int n=(int)strlen(s),start=0;for(int i=1;i<=n;++i)if(i==n||s[i]!=s[start]){printf("%c %d\n",s[start],i-start);start=i;}return 0;}`,
  "prefix-sum": String.raw`#include <stdio.h>
#include <stdlib.h>
int main(void){int n,q;if(scanf("%d%d",&n,&q)!=2)return 0;long long*p=calloc((size_t)n+1,sizeof(long long));for(int i=1;i<=n;++i){long long x;scanf("%lld",&x);p[i]=p[i-1]+x;}while(q--){int l,r;scanf("%d%d",&l,&r);printf("%lld\n",p[r]-p[l-1]);}free(p);return 0;}`,
  "two-pointers": String.raw`#include <stdio.h>
#include <stdlib.h>
int main(void){int n;long long target;if(scanf("%d%lld",&n,&target)!=2)return 0;long long*a=malloc(sizeof(long long)*(size_t)n);for(int i=0;i<n;++i)scanf("%lld",&a[i]);int l=0,r=n-1;while(l<r){long long sum=a[l]+a[r];if(sum==target){puts("YES");free(a);return 0;}if(sum<target)++l;else --r;}puts("NO");free(a);return 0;}`,
  "sliding-window": String.raw`#include <stdio.h>
#include <stdlib.h>
int main(void){int n,k;if(scanf("%d%d",&n,&k)!=2)return 0;char*s=malloc((size_t)n+1);scanf("%s",s);int count[26]={0},left=0,kinds=0,answer=0;for(int right=0;right<n;++right){int x=s[right]-'a';if(count[x]++==0)++kinds;while(kinds>k){int y=s[left++]-'a';if(--count[y]==0)--kinds;}int length=right-left+1;if(length>answer)answer=length;}printf("%d",answer);free(s);return 0;}`,
  "recursion-backtracking": String.raw`#include <stdio.h>
#include <stdlib.h>
static int n,r,values[9],path[9],used[9];
static int compare(const void*a,const void*b){return *(const int*)a-*(const int*)b;}
static void search(int depth){if(depth==r){for(int i=0;i<r;++i)printf("%d%c",path[i],i+1==r?'\n':' ');return;}for(int i=0;i<n;++i)if(!used[i]){used[i]=1;path[depth]=values[i];search(depth+1);used[i]=0;}}
int main(void){scanf("%d%d",&n,&r);for(int i=0;i<n;++i)scanf("%d",&values[i]);qsort(values,(size_t)n,sizeof(int),compare);search(0);return 0;}`,
  greedy: String.raw`#include <stdio.h>
int main(void){long long amount,answer=0;int coins[]={500,100,50,10,5,1};if(scanf("%lld",&amount)!=1)return 0;for(int i=0;i<6;++i){answer+=amount/coins[i];amount%=coins[i];}printf("%lld",answer);return 0;}`,
  "binary-tree": String.raw`#include <stdio.h>
#include <stdlib.h>
int main(void){int n;if(scanf("%d",&n)!=1)return 0;int*left=calloc((size_t)n+1,sizeof(int));int*right=calloc((size_t)n+1,sizeof(int));int*queue=malloc(sizeof(int)*(size_t)n);for(int i=1;i<=n;++i)scanf("%d%d",&left[i],&right[i]);int head=0,tail=0,height=0;queue[tail++]=1;while(head<tail){int end=tail;++height;while(head<end){int node=queue[head++];if(left[node])queue[tail++]=left[node];if(right[node])queue[tail++]=right[node];}}printf("%d",height);free(left);free(right);free(queue);return 0;}`,
  "binary-search-tree": String.raw`#include <stdio.h>
#include <stdlib.h>
typedef struct{long long key;int left,right;}Node;typedef struct{int node;long long low,high;}State;
int main(void){int n;if(scanf("%d",&n)!=1)return 0;Node*a=calloc((size_t)n+1,sizeof(Node));State*stack=malloc(sizeof(State)*(size_t)n);for(int i=1;i<=n;++i)scanf("%lld%d%d",&a[i].key,&a[i].left,&a[i].right);int top=0;stack[top++]=(State){1,-4000000000000000000LL,4000000000000000000LL};while(top){State s=stack[--top];Node x=a[s.node];if(x.key<=s.low||x.key>=s.high){puts("NO");free(a);free(stack);return 0;}if(x.left)stack[top++]=(State){x.left,s.low,x.key};if(x.right)stack[top++]=(State){x.right,x.key,s.high};}puts("YES");free(a);free(stack);return 0;}`,
  dijkstra: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <limits.h>
typedef struct{int to,w,next;}Edge;typedef struct{long long dist;int node;}HeapItem;
static void push(HeapItem*h,int*size,HeapItem x){int i=++*size;while(i>1&&h[i/2].dist>x.dist){h[i]=h[i/2];i/=2;}h[i]=x;}
static HeapItem pop(HeapItem*h,int*size){HeapItem root=h[1],last=h[(*size)--];int i=1;while(i*2<=*size){int child=i*2;if(child<*size&&h[child+1].dist<h[child].dist)++child;if(h[child].dist>=last.dist)break;h[i]=h[child];i=child;}if(*size>=0)h[i]=last;return root;}
int main(void){int n,m,start;if(scanf("%d%d%d",&n,&m,&start)!=3)return 0;int*head=malloc(sizeof(int)*((size_t)n+1));for(int i=1;i<=n;++i)head[i]=-1;Edge*edges=malloc(sizeof(Edge)*(size_t)m);for(int i=0;i<m;++i){int u;scanf("%d%d%d",&u,&edges[i].to,&edges[i].w);edges[i].next=head[u];head[u]=i;}long long inf=LLONG_MAX/4,*dist=malloc(sizeof(long long)*((size_t)n+1));for(int i=1;i<=n;++i)dist[i]=inf;HeapItem*heap=malloc(sizeof(HeapItem)*((size_t)m+2));int size=0;dist[start]=0;push(heap,&size,(HeapItem){0,start});while(size){HeapItem current=pop(heap,&size);if(current.dist!=dist[current.node])continue;for(int e=head[current.node];e!=-1;e=edges[e].next){long long next=current.dist+edges[e].w;if(next<dist[edges[e].to]){dist[edges[e].to]=next;push(heap,&size,(HeapItem){next,edges[e].to});}}}for(int i=1;i<=n;++i){if(i>1)putchar(' ');if(dist[i]==inf)printf("INF");else printf("%lld",dist[i]);}free(head);free(edges);free(dist);free(heap);return 0;}`,
  "topological-sort": String.raw`#include <stdio.h>
#include <stdlib.h>
static void push(int*h,int*size,int x){int i=++*size;while(i>1&&h[i/2]>x){h[i]=h[i/2];i/=2;}h[i]=x;}static int pop(int*h,int*size){int root=h[1],last=h[(*size)--],i=1;while(i*2<=*size){int c=i*2;if(c<*size&&h[c+1]<h[c])++c;if(h[c]>=last)break;h[i]=h[c];i=c;}if(*size>=0)h[i]=last;return root;}
int main(void){int n,m;if(scanf("%d%d",&n,&m)!=2)return 0;int*head=malloc(sizeof(int)*((size_t)n+1)),*deg=calloc((size_t)n+1,sizeof(int)),*to=malloc(sizeof(int)*(size_t)m),*next=malloc(sizeof(int)*(size_t)m),*heap=malloc(sizeof(int)*((size_t)n+1));for(int i=1;i<=n;++i)head[i]=-1;for(int i=0;i<m;++i){int a,b;scanf("%d%d",&a,&b);to[i]=b;next[i]=head[a];head[a]=i;++deg[b];}int size=0;for(int i=1;i<=n;++i)if(!deg[i])push(heap,&size,i);int first=1;while(size){int u=pop(heap,&size);if(!first)putchar(' ');first=0;printf("%d",u);for(int e=head[u];e!=-1;e=next[e])if(--deg[to[e]]==0)push(heap,&size,to[e]);}free(head);free(deg);free(to);free(next);free(heap);return 0;}`,
  "knapsack-dp": String.raw`#include <stdio.h>
#include <stdlib.h>
int main(void){int n,capacity;if(scanf("%d%d",&n,&capacity)!=2)return 0;long long*dp=calloc((size_t)capacity+1,sizeof(long long));for(int i=0;i<n;++i){int weight;long long value;scanf("%d%lld",&weight,&value);for(int c=capacity;c>=weight;--c){long long candidate=dp[c-weight]+value;if(candidate>dp[c])dp[c]=candidate;}}printf("%lld",dp[capacity]);free(dp);return 0;}`,
} satisfies Partial<ReferenceSolutionSet>;
