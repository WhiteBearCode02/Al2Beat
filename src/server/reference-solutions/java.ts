import type { ReferenceSolutionSet } from "./types.ts";

const scanner = String.raw`static class FastScanner {
    private final byte[] buffer = new byte[1 << 16];
    private int position = 0, length = 0;
    private int read() throws Exception {
        if (position >= length) { length = System.in.read(buffer); position = 0; }
        return length < 0 ? -1 : buffer[position++];
    }
    String next() throws Exception {
        StringBuilder value = new StringBuilder();
        int ch; do { ch = read(); } while (ch <= 32 && ch != -1);
        while (ch > 32 && ch != -1) { value.append((char) ch); ch = read(); }
        return value.toString();
    }
    int nextInt() throws Exception { return Integer.parseInt(next()); }
    long nextLong() throws Exception { return Long.parseLong(next()); }
}`;

export const javaSolutions = {
  stack: String.raw`import java.io.*;

public class Main {
    public static void main(String[] args) throws Exception {
        String input = new BufferedReader(new InputStreamReader(System.in)).readLine().trim();
        char[] stack = new char[input.length()];
        int top = 0;
        for (char ch : input.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') stack[top++] = ch;
            else {
                char expected = ch == ')' ? '(' : ch == ']' ? '[' : '{';
                if (top == 0 || stack[--top] != expected) { System.out.println("NO"); return; }
            }
        }
        System.out.println(top == 0 ? "YES" : "NO");
    }
}`,
  queue: String.raw`import java.io.*;

public class Main {
    ${scanner}
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int capacity = input.nextInt(), count = input.nextInt();
        int[] queue = new int[capacity];
        int front = 0, size = 0;
        for (int i = 0; i < count; i++) {
            int command = input.nextInt();
            if (command == 0) {
                if (size > 0) { front = (front + 1) % capacity; size--; }
            } else if (size < capacity) {
                queue[(front + size) % capacity] = command;
                size++;
            }
        }
        if (size == 0) System.out.print("EMPTY");
        else {
            StringBuilder answer = new StringBuilder();
            for (int i = 0; i < size; i++) {
                if (i > 0) answer.append(' ');
                answer.append(queue[(front + i) % capacity]);
            }
            System.out.print(answer);
        }
    }
}`,
  "hash-map": String.raw`import java.io.*;
import java.util.*;

public class Main {
    ${scanner}
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int n = input.nextInt(), top = 0;
        String best = "";
        Map<String, Integer> counts = new HashMap<>();
        for (int i = 0; i < n; i++) {
            String name = input.next();
            int count = counts.getOrDefault(name, 0) + 1;
            counts.put(name, count);
            if (count > top || (count == top && (best.isEmpty() || name.compareTo(best) < 0))) {
                top = count;
                best = name;
            }
        }
        System.out.print(best + " " + top);
    }
}`,
  "binary-search": String.raw`import java.io.*;

public class Main {
    ${scanner}
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int n = input.nextInt();
        long target = input.nextLong();
        long[] scores = new long[n];
        for (int i = 0; i < n; i++) scores[i] = input.nextLong();
        int left = 0, right = n;
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (scores[mid] < target) left = mid + 1;
            else right = mid;
        }
        System.out.print(left < n ? left + 1 : -1);
    }
}`,
  "merge-sort": String.raw`import java.io.*;

public class Main {
    static class Person {
        int score; String name;
        Person(int score, String name) { this.score = score; this.name = name; }
    }
    ${scanner}
    static void mergeSort(Person[] people, Person[] buffer, int left, int right) {
        if (right - left <= 1) return;
        int mid = left + (right - left) / 2;
        mergeSort(people, buffer, left, mid);
        mergeSort(people, buffer, mid, right);
        int i = left, j = mid, out = left;
        while (i < mid && j < right)
            buffer[out++] = people[i].score <= people[j].score ? people[i++] : people[j++];
        while (i < mid) buffer[out++] = people[i++];
        while (j < right) buffer[out++] = people[j++];
        for (i = left; i < right; i++) people[i] = buffer[i];
    }
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int n = input.nextInt();
        Person[] people = new Person[n], buffer = new Person[n];
        for (int i = 0; i < n; i++) people[i] = new Person(input.nextInt(), input.next());
        mergeSort(people, buffer, 0, n);
        StringBuilder answer = new StringBuilder();
        for (Person person : people) answer.append(person.score).append(' ').append(person.name).append('\n');
        System.out.print(answer);
    }
}`,
  bfs: String.raw`import java.io.*;
import java.util.*;

public class Main {
    ${scanner}
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int height = input.nextInt(), width = input.nextInt();
        String[] grid = new String[height];
        for (int i = 0; i < height; i++) grid[i] = input.next();
        int[] distance = new int[height * width];
        Arrays.fill(distance, -1);
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        distance[0] = 1;
        queue.add(0);
        int[] dy = {1, -1, 0, 0}, dx = {0, 0, 1, -1};
        while (!queue.isEmpty()) {
            int current = queue.remove(), y = current / width, x = current % width;
            for (int direction = 0; direction < 4; direction++) {
                int ny = y + dy[direction], nx = x + dx[direction];
                if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
                int next = ny * width + nx;
                if (grid[ny].charAt(nx) == '0' && distance[next] == -1) {
                    distance[next] = distance[current] + 1;
                    queue.add(next);
                }
            }
        }
        System.out.print(distance[height * width - 1]);
    }
}`,
  dfs: String.raw`import java.io.*;
import java.util.*;

public class Main {
    ${scanner}
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int vertices = input.nextInt(), edges = input.nextInt();
        List<Integer>[] graph = new ArrayList[vertices + 1];
        for (int i = 1; i <= vertices; i++) graph[i] = new ArrayList<>();
        for (int i = 0; i < edges; i++) {
            int a = input.nextInt(), b = input.nextInt();
            graph[a].add(b); graph[b].add(a);
        }
        boolean[] seen = new boolean[vertices + 1];
        int answer = 0;
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        for (int start = 1; start <= vertices; start++) {
            if (seen[start]) continue;
            answer++; seen[start] = true; stack.push(start);
            while (!stack.isEmpty()) {
                int node = stack.pop();
                for (int next : graph[node]) if (!seen[next]) { seen[next] = true; stack.push(next); }
            }
        }
        System.out.print(answer);
    }
}`,
  "basic-dp": String.raw`import java.io.*;

public class Main {
    ${scanner}
    public static void main(String[] args) throws Exception {
        FastScanner input = new FastScanner();
        int n = input.nextInt();
        long previousTwo = input.nextLong();
        if (n == 1) { System.out.print(previousTwo); return; }
        long previousOne = input.nextLong();
        for (int i = 2; i < n; i++) {
            long current = Math.min(previousTwo, previousOne) + input.nextLong();
            previousTwo = previousOne;
            previousOne = current;
        }
        System.out.print(previousOne);
    }
}`,
} satisfies ReferenceSolutionSet;
