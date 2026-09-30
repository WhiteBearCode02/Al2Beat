import type { ReferenceSolutionSet } from "./types.ts";

const scanner = String.raw`sealed class FastScanner
{
    private readonly System.IO.Stream input = Console.OpenStandardInput();
    private readonly byte[] buffer = new byte[1 << 16];
    private int position, length;
    private int Read()
    {
        if (position >= length) { length = input.Read(buffer, 0, buffer.Length); position = 0; }
        return length == 0 ? -1 : buffer[position++];
    }
    public string Next()
    {
        var value = new StringBuilder();
        int ch; do { ch = Read(); } while (ch <= 32 && ch != -1);
        while (ch > 32 && ch != -1) { value.Append((char)ch); ch = Read(); }
        return value.ToString();
    }
    public int NextInt() => int.Parse(Next());
    public long NextLong() => long.Parse(Next());
}`;

export const csharpSolutions = {
  stack: String.raw`using System;

public static class Program
{
    public static void Main()
    {
        string input = Console.ReadLine().Trim();
        char[] stack = new char[input.Length];
        int top = 0;
        foreach (char ch in input)
        {
            if (ch == '(' || ch == '[' || ch == '{') stack[top++] = ch;
            else
            {
                char expected = ch == ')' ? '(' : ch == ']' ? '[' : '{';
                if (top == 0 || stack[--top] != expected) { Console.WriteLine("NO"); return; }
            }
        }
        Console.WriteLine(top == 0 ? "YES" : "NO");
    }
}`,
  queue: String.raw`using System;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int capacity = input.NextInt(), count = input.NextInt();
        int[] queue = new int[capacity];
        int front = 0, size = 0;
        for (int i = 0; i < count; i++)
        {
            int command = input.NextInt();
            if (command == 0)
            {
                if (size > 0) { front = (front + 1) % capacity; size--; }
            }
            else if (size < capacity) { queue[(front + size) % capacity] = command; size++; }
        }
        if (size == 0) Console.Write("EMPTY");
        else
        {
            var answer = new StringBuilder();
            for (int i = 0; i < size; i++)
            {
                if (i > 0) answer.Append(' ');
                answer.Append(queue[(front + i) % capacity]);
            }
            Console.Write(answer);
        }
    }
}`,
  "hash-map": String.raw`using System;
using System.Collections.Generic;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int n = input.NextInt(), top = 0;
        string best = "";
        var counts = new Dictionary<string, int>(StringComparer.Ordinal);
        for (int i = 0; i < n; i++)
        {
            string name = input.Next();
            counts.TryGetValue(name, out int count);
            counts[name] = ++count;
            if (count > top || (count == top && (best.Length == 0 || string.CompareOrdinal(name, best) < 0)))
            { top = count; best = name; }
        }
        Console.Write(best + " " + top);
    }
}`,
  deque: String.raw`using System;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int q = input.NextInt();
        int[] values = new int[q * 2 + 1];
        int left = q, right = q;
        while (q-- > 0)
        {
            string command = input.Next();
            if (command == "LF") values[--left] = input.NextInt();
            else if (command == "LB") values[right++] = input.NextInt();
            else if (command == "PF") { if (left < right) left++; }
            else if (left < right) right--;
        }
        if (left == right) Console.Write("EMPTY");
        else
        {
            var answer = new StringBuilder();
            for (int i = left; i < right; i++) { if (i > left) answer.Append(' '); answer.Append(values[i]); }
            Console.Write(answer);
        }
    }
}`,
  "linked-list": String.raw`using System;
using System.Collections.Generic;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        var text = new LinkedList<char>();
        foreach (char value in input.Next()) text.AddLast(value);
        LinkedListNode<char> cursor = null;
        int q = input.NextInt();
        while (q-- > 0)
        {
            char command = input.Next()[0];
            if (command == 'L')
            {
                LinkedListNode<char> target = cursor == null ? text.Last : cursor.Previous;
                if (target != null) cursor = target;
            }
            else if (command == 'R') { if (cursor != null) cursor = cursor.Next; }
            else if (command == 'D')
            {
                LinkedListNode<char> target = cursor == null ? text.Last : cursor.Previous;
                if (target != null) text.Remove(target);
            }
            else
            {
                char value = input.Next()[0];
                if (cursor == null) text.AddLast(value); else text.AddBefore(cursor, value);
            }
        }
        var answer = new StringBuilder(text.Count);
        foreach (char value in text) answer.Append(value);
        Console.Write(answer);
    }
}`,
  "min-heap": String.raw`using System;
using System.Collections.Generic;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int q = input.NextInt();
        var heap = new PriorityQueue<long, long>();
        var answer = new StringBuilder();
        while (q-- > 0)
        {
            char command = input.Next()[0];
            if (command == 'P') { long value = input.NextLong(); heap.Enqueue(value, value); }
            else answer.Append(heap.Count == 0 ? "EMPTY" : heap.Dequeue().ToString()).Append('\n');
        }
        Console.Write(answer);
    }
}`,
  "binary-search": String.raw`using System;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int n = input.NextInt();
        long target = input.NextLong();
        long[] scores = new long[n];
        for (int i = 0; i < n; i++) scores[i] = input.NextLong();
        int left = 0, right = n;
        while (left < right)
        {
            int mid = left + (right - left) / 2;
            if (scores[mid] < target) left = mid + 1;
            else right = mid;
        }
        Console.Write(left < n ? left + 1 : -1);
    }
}`,
  "merge-sort": String.raw`using System;
using System.Text;

${scanner}

sealed class Person
{
    public int Score;
    public string Name;
    public Person(int score, string name) { Score = score; Name = name; }
}

public static class Program
{
    static void MergeSort(Person[] people, Person[] buffer, int left, int right)
    {
        if (right - left <= 1) return;
        int mid = left + (right - left) / 2;
        MergeSort(people, buffer, left, mid);
        MergeSort(people, buffer, mid, right);
        int i = left, j = mid, output = left;
        while (i < mid && j < right)
            buffer[output++] = people[i].Score <= people[j].Score ? people[i++] : people[j++];
        while (i < mid) buffer[output++] = people[i++];
        while (j < right) buffer[output++] = people[j++];
        for (i = left; i < right; i++) people[i] = buffer[i];
    }

    public static void Main()
    {
        var input = new FastScanner();
        int n = input.NextInt();
        var people = new Person[n];
        var buffer = new Person[n];
        for (int i = 0; i < n; i++) people[i] = new Person(input.NextInt(), input.Next());
        MergeSort(people, buffer, 0, n);
        var answer = new StringBuilder();
        foreach (Person person in people) answer.Append(person.Score).Append(' ').Append(person.Name).Append('\n');
        Console.Write(answer);
    }
}`,
  bfs: String.raw`using System;
using System.Collections.Generic;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int height = input.NextInt(), width = input.NextInt();
        var grid = new string[height];
        for (int i = 0; i < height; i++) grid[i] = input.Next();
        int[] distance = new int[height * width];
        Array.Fill(distance, -1);
        var queue = new Queue<int>();
        distance[0] = 1;
        queue.Enqueue(0);
        int[] dy = { 1, -1, 0, 0 }, dx = { 0, 0, 1, -1 };
        while (queue.Count > 0)
        {
            int current = queue.Dequeue(), y = current / width, x = current % width;
            for (int direction = 0; direction < 4; direction++)
            {
                int ny = y + dy[direction], nx = x + dx[direction];
                if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
                int next = ny * width + nx;
                if (grid[ny][nx] == '0' && distance[next] == -1)
                { distance[next] = distance[current] + 1; queue.Enqueue(next); }
            }
        }
        Console.Write(distance[height * width - 1]);
    }
}`,
  dfs: String.raw`using System;
using System.Collections.Generic;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int vertices = input.NextInt(), edges = input.NextInt();
        var graph = new List<int>[vertices + 1];
        for (int i = 1; i <= vertices; i++) graph[i] = new List<int>();
        for (int i = 0; i < edges; i++)
        {
            int a = input.NextInt(), b = input.NextInt();
            graph[a].Add(b); graph[b].Add(a);
        }
        var seen = new bool[vertices + 1];
        var stack = new Stack<int>();
        int answer = 0;
        for (int start = 1; start <= vertices; start++)
        {
            if (seen[start]) continue;
            answer++; seen[start] = true; stack.Push(start);
            while (stack.Count > 0)
            {
                int node = stack.Pop();
                foreach (int next in graph[node])
                    if (!seen[next]) { seen[next] = true; stack.Push(next); }
            }
        }
        Console.Write(answer);
    }
}`,
  "union-find": String.raw`using System;
using System.Text;

${scanner}

public static class Program
{
    static int[] parent, size;
    static int Find(int node)
    {
        int root = node;
        while (parent[root] != root) root = parent[root];
        while (parent[node] != node) { int next = parent[node]; parent[node] = root; node = next; }
        return root;
    }
    static void Union(int a, int b)
    {
        int rootA = Find(a), rootB = Find(b);
        if (rootA == rootB) return;
        if (size[rootA] < size[rootB]) { int temp = rootA; rootA = rootB; rootB = temp; }
        parent[rootB] = rootA;
        size[rootA] += size[rootB];
    }
    public static void Main()
    {
        var input = new FastScanner();
        int n = input.NextInt(), q = input.NextInt();
        parent = new int[n + 1]; size = new int[n + 1];
        for (int i = 1; i <= n; i++) { parent[i] = i; size[i] = 1; }
        var answer = new StringBuilder();
        while (q-- > 0)
        {
            char command = input.Next()[0];
            int a = input.NextInt(), b = input.NextInt();
            if (command == 'U') Union(a, b);
            else answer.Append(Find(a) == Find(b) ? "YES" : "NO").Append('\n');
        }
        Console.Write(answer);
    }
}`,
  "basic-dp": String.raw`using System;
using System.Text;

${scanner}

public static class Program
{
    public static void Main()
    {
        var input = new FastScanner();
        int n = input.NextInt();
        long previousTwo = input.NextLong();
        if (n == 1) { Console.Write(previousTwo); return; }
        long previousOne = input.NextLong();
        for (int i = 2; i < n; i++)
        {
            long current = Math.Min(previousTwo, previousOne) + input.NextLong();
            previousTwo = previousOne;
            previousOne = current;
        }
        Console.Write(previousOne);
    }
}`,
} satisfies ReferenceSolutionSet;
