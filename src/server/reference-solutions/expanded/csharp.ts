import type { ReferenceSolutionSet } from "../types.ts";

const scanner = String.raw`sealed class FastScanner {
    readonly Stream input = Console.OpenStandardInput(); readonly byte[] buffer = new byte[1 << 16]; int position, length;
    int Read(){ if(position>=length){length=input.Read(buffer,0,buffer.Length);position=0;if(length==0)return -1;}return buffer[position++]; }
    public long NextLong(){int c,sign=1;long value=0;do c=Read();while(c<=32&&c>=0);if(c=='-'){sign=-1;c=Read();}while(c>32){value=value*10+c-'0';c=Read();}return value*sign;}
    public int NextInt()=>checked((int)NextLong());
    public string Next(){int c;var value=new StringBuilder();do c=Read();while(c<=32&&c>=0);while(c>32){value.Append((char)c);c=Read();}return value.ToString();}
}`;
const csharp = (body: string) => String.raw`using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
${scanner}
public class Program {
${body}
}`;

export const expandedCsharpSolutions = {
  "array-string": csharp(String.raw`public static void Main(){var fs=new FastScanner();string s=fs.Next();var output=new StringBuilder();int start=0;for(int i=1;i<=s.Length;i++)if(i==s.Length||s[i]!=s[start]){output.Append(s[start]).Append(' ').Append(i-start).Append('\n');start=i;}Console.Write(output);}`),
  "prefix-sum": csharp(String.raw`public static void Main(){var fs=new FastScanner();int n=fs.NextInt(),q=fs.NextInt();var prefix=new long[n+1];for(int i=1;i<=n;i++)prefix[i]=prefix[i-1]+fs.NextLong();var output=new StringBuilder();while(q-->0){int left=fs.NextInt(),right=fs.NextInt();output.Append(prefix[right]-prefix[left-1]).Append('\n');}Console.Write(output);}`),
  "two-pointers": csharp(String.raw`public static void Main(){var fs=new FastScanner();int n=fs.NextInt();long target=fs.NextLong();var values=new long[n];for(int i=0;i<n;i++)values[i]=fs.NextLong();int left=0,right=n-1;while(left<right){long sum=values[left]+values[right];if(sum==target){Console.Write("YES");return;}if(sum<target)left++;else right--;}Console.Write("NO");}`),
  "sliding-window": csharp(String.raw`public static void Main(){var fs=new FastScanner();int n=fs.NextInt(),k=fs.NextInt();string s=fs.Next();var count=new int[26];int left=0,kinds=0,answer=0;for(int right=0;right<n;right++){int x=s[right]-'a';if(count[x]++==0)kinds++;while(kinds>k){int y=s[left++]-'a';if(--count[y]==0)kinds--;}answer=Math.Max(answer,right-left+1);}Console.Write(answer);}`),
  "recursion-backtracking": csharp(String.raw`static int n,r;static int[] values=Array.Empty<int>(),path=Array.Empty<int>();static bool[] used=Array.Empty<bool>();static readonly StringBuilder output=new();
static void Search(int depth){if(depth==r){for(int i=0;i<r;i++){if(i>0)output.Append(' ');output.Append(path[i]);}output.Append('\n');return;}for(int i=0;i<n;i++)if(!used[i]){used[i]=true;path[depth]=values[i];Search(depth+1);used[i]=false;}}
public static void Main(){var fs=new FastScanner();n=fs.NextInt();r=fs.NextInt();values=new int[n];path=new int[r];used=new bool[n];for(int i=0;i<n;i++)values[i]=fs.NextInt();Array.Sort(values);Search(0);Console.Write(output);}`),
  greedy: csharp(String.raw`public static void Main(){var fs=new FastScanner();long amount=fs.NextLong(),answer=0;foreach(int coin in new[]{500,100,50,10,5,1}){answer+=amount/coin;amount%=coin;}Console.Write(answer);}`),
  "binary-tree": csharp(String.raw`public static void Main(){var fs=new FastScanner();int n=fs.NextInt();var children=new int[n+1,2];for(int i=1;i<=n;i++){children[i,0]=fs.NextInt();children[i,1]=fs.NextInt();}var queue=new Queue<int>();queue.Enqueue(1);int height=0;while(queue.Count>0){height++;int size=queue.Count;while(size-->0){int node=queue.Dequeue();if(children[node,0]!=0)queue.Enqueue(children[node,0]);if(children[node,1]!=0)queue.Enqueue(children[node,1]);}}Console.Write(height);}`),
  "binary-search-tree": csharp(String.raw`readonly record struct Node(long Key,int Left,int Right);
public static void Main(){var fs=new FastScanner();int n=fs.NextInt();var nodes=new Node[n+1];for(int i=1;i<=n;i++)nodes[i]=new Node(fs.NextLong(),fs.NextInt(),fs.NextInt());var stack=new Stack<(int Node,long Low,long High)>();stack.Push((1,long.MinValue,long.MaxValue));while(stack.Count>0){var state=stack.Pop();Node current=nodes[state.Node];if(current.Key<=state.Low||current.Key>=state.High){Console.Write("NO");return;}if(current.Left!=0)stack.Push((current.Left,state.Low,current.Key));if(current.Right!=0)stack.Push((current.Right,current.Key,state.High));}Console.Write("YES");}`),
  dijkstra: csharp(String.raw`readonly record struct Edge(int To,int Weight);
public static void Main(){var fs=new FastScanner();int n=fs.NextInt(),m=fs.NextInt(),start=fs.NextInt();var graph=new List<Edge>[n+1];for(int i=1;i<=n;i++)graph[i]=new List<Edge>();while(m-->0){int from=fs.NextInt();graph[from].Add(new Edge(fs.NextInt(),fs.NextInt()));}long infinity=long.MaxValue/4;var distance=new long[n+1];Array.Fill(distance,infinity);var queue=new PriorityQueue<(int Node,long Cost),long>();distance[start]=0;queue.Enqueue((start,0),0);while(queue.Count>0){var current=queue.Dequeue();if(current.Cost!=distance[current.Node])continue;foreach(var edge in graph[current.Node]){long next=current.Cost+edge.Weight;if(next<distance[edge.To]){distance[edge.To]=next;queue.Enqueue((edge.To,next),next);}}}var output=new StringBuilder();for(int i=1;i<=n;i++){if(i>1)output.Append(' ');output.Append(distance[i]==infinity?"INF":distance[i]);}Console.Write(output);}`),
  "topological-sort": csharp(String.raw`public static void Main(){var fs=new FastScanner();int n=fs.NextInt(),m=fs.NextInt();var graph=new List<int>[n+1];var indegree=new int[n+1];for(int i=1;i<=n;i++)graph[i]=new List<int>();while(m-->0){int before=fs.NextInt(),after=fs.NextInt();graph[before].Add(after);indegree[after]++;}var queue=new PriorityQueue<int,int>();for(int i=1;i<=n;i++)if(indegree[i]==0)queue.Enqueue(i,i);var output=new StringBuilder();while(queue.Count>0){int node=queue.Dequeue();if(output.Length>0)output.Append(' ');output.Append(node);foreach(int next in graph[node])if(--indegree[next]==0)queue.Enqueue(next,next);}Console.Write(output);}`),
  "knapsack-dp": csharp(String.raw`public static void Main(){var fs=new FastScanner();int n=fs.NextInt(),capacity=fs.NextInt();var dp=new long[capacity+1];while(n-->0){int weight=fs.NextInt();long value=fs.NextLong();for(int current=capacity;current>=weight;current--)dp[current]=Math.Max(dp[current],dp[current-weight]+value);}Console.Write(dp[capacity]);}`),
} satisfies Partial<ReferenceSolutionSet>;
