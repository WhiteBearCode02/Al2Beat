import type { ReferenceSolutionSet } from "./types.ts";

export const cSolutions = {
  stack: String.raw`#include <stdio.h>
#include <string.h>

int main(void) {
    static char input[100001], stack[100001];
    int top = 0;
    if (scanf("%100000s", input) != 1) return 0;
    for (int i = 0; input[i]; ++i) {
        char ch = input[i];
        if (ch == '(' || ch == '[' || ch == '{') stack[top++] = ch;
        else {
            char expected = ch == ')' ? '(' : ch == ']' ? '[' : '{';
            if (top == 0 || stack[--top] != expected) {
                puts("NO");
                return 0;
            }
        }
    }
    puts(top == 0 ? "YES" : "NO");
    return 0;
}`,
  queue: String.raw`#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int capacity, count;
    if (scanf("%d %d", &capacity, &count) != 2) return 0;
    int *queue = malloc((size_t)capacity * sizeof(*queue));
    int front = 0, size = 0;
    for (int i = 0; i < count; ++i) {
        int command;
        scanf("%d", &command);
        if (command == 0) {
            if (size > 0) { front = (front + 1) % capacity; --size; }
        } else if (size < capacity) {
            queue[(front + size) % capacity] = command;
            ++size;
        }
    }
    if (size == 0) printf("EMPTY");
    else for (int i = 0; i < size; ++i)
        printf("%s%d", i ? " " : "", queue[(front + i) % capacity]);
    free(queue);
    return 0;
}`,
  "hash-map": String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static char *read_word(void) {
    int ch;
    do ch = getchar(); while (ch != EOF && ch <= ' ');
    size_t size = 0, capacity = 16;
    char *word = malloc(capacity);
    while (ch != EOF && ch > ' ') {
        if (size + 1 == capacity) { capacity *= 2; word = realloc(word, capacity); }
        word[size++] = (char)ch;
        ch = getchar();
    }
    word[size] = '\0';
    return word;
}

static int compare_words(const void *left, const void *right) {
    return strcmp(*(const char *const *)left, *(const char *const *)right);
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    char **names = malloc((size_t)n * sizeof(*names));
    for (int i = 0; i < n; ++i) names[i] = read_word();
    qsort(names, (size_t)n, sizeof(*names), compare_words);
    int best_start = 0, best_count = 0;
    for (int start = 0; start < n;) {
        int end = start + 1;
        while (end < n && strcmp(names[start], names[end]) == 0) ++end;
        if (end - start > best_count) { best_start = start; best_count = end - start; }
        start = end;
    }
    printf("%s %d", names[best_start], best_count);
    for (int i = 0; i < n; ++i) free(names[i]);
    free(names);
    return 0;
}`,
  deque: String.raw`#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int q;
    if (scanf("%d", &q) != 1) return 0;
    int *values = malloc((size_t)(2 * q + 1) * sizeof(*values));
    int left = q, right = q;
    while (q--) {
        char command[3];
        scanf("%2s", command);
        if (command[0] == 'L' && command[1] == 'F') scanf("%d", &values[--left]);
        else if (command[0] == 'L') scanf("%d", &values[right++]);
        else if (command[1] == 'F') { if (left < right) ++left; }
        else if (left < right) --right;
    }
    if (left == right) printf("EMPTY");
    else for (int i = left; i < right; ++i) printf("%s%d", i == left ? "" : " ", values[i]);
    free(values);
    return 0;
}`,
  "linked-list": String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    static char initial[200001];
    int q;
    if (scanf("%200000s", initial) != 1 || scanf("%d", &q) != 1) return 0;
    int capacity = (int)strlen(initial) + q + 2;
    char *value = malloc((size_t)capacity);
    int *previous = malloc((size_t)capacity * sizeof(*previous));
    int *next = malloc((size_t)capacity * sizeof(*next));
    int nodes = 2, cursor = 1;
    next[0] = 1; previous[1] = 0;
    for (int i = 0; initial[i]; ++i) {
        int node = nodes++, left = previous[cursor];
        value[node] = initial[i]; previous[node] = left; next[node] = cursor;
        next[left] = node; previous[cursor] = node;
    }
    while (q--) {
        char command;
        scanf(" %c", &command);
        if (command == 'L') {
            if (previous[cursor] != 0) cursor = previous[cursor];
        } else if (command == 'R') {
            if (cursor != 1) cursor = next[cursor];
        } else if (command == 'D') {
            int target = previous[cursor];
            if (target != 0) { int left = previous[target]; next[left] = cursor; previous[cursor] = left; }
        } else {
            char inserted; scanf(" %c", &inserted);
            int node = nodes++, left = previous[cursor];
            value[node] = inserted; previous[node] = left; next[node] = cursor;
            next[left] = node; previous[cursor] = node;
        }
    }
    for (int node = next[0]; node != 1; node = next[node]) putchar(value[node]);
    free(value); free(previous); free(next);
    return 0;
}`,
  "min-heap": String.raw`#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int q, size = 0;
    if (scanf("%d", &q) != 1) return 0;
    long long *heap = malloc((size_t)(q + 1) * sizeof(*heap));
    while (q--) {
        char command; scanf(" %c", &command);
        if (command == 'P') {
            long long value; scanf("%lld", &value);
            int child = ++size;
            while (child > 1 && heap[child / 2] > value) { heap[child] = heap[child / 2]; child /= 2; }
            heap[child] = value;
        } else if (size == 0) printf("EMPTY\n");
        else {
            printf("%lld\n", heap[1]);
            long long last = heap[size--];
            int parent = 1;
            while (parent * 2 <= size) {
                int child = parent * 2;
                if (child < size && heap[child + 1] < heap[child]) ++child;
                if (heap[child] >= last) break;
                heap[parent] = heap[child]; parent = child;
            }
            if (size > 0) heap[parent] = last;
        }
    }
    free(heap);
    return 0;
}`,
  "binary-search": String.raw`#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n;
    long long target;
    if (scanf("%d %lld", &n, &target) != 2) return 0;
    long long *scores = malloc((size_t)n * sizeof(*scores));
    for (int i = 0; i < n; ++i) scanf("%lld", &scores[i]);
    int left = 0, right = n;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (scores[mid] < target) left = mid + 1;
        else right = mid;
    }
    printf("%d", left < n ? left + 1 : -1);
    free(scores);
    return 0;
}`,
  "merge-sort": String.raw`#include <stdio.h>
#include <stdlib.h>

typedef struct { int score; char name[21]; } Person;

static void merge_sort(Person *people, Person *buffer, int left, int right) {
    if (right - left <= 1) return;
    int mid = left + (right - left) / 2;
    merge_sort(people, buffer, left, mid);
    merge_sort(people, buffer, mid, right);
    int i = left, j = mid, out = left;
    while (i < mid && j < right)
        buffer[out++] = people[i].score <= people[j].score ? people[i++] : people[j++];
    while (i < mid) buffer[out++] = people[i++];
    while (j < right) buffer[out++] = people[j++];
    for (i = left; i < right; ++i) people[i] = buffer[i];
}

int main(void) {
    int n;
    if (scanf("%d", &n) != 1) return 0;
    Person *people = malloc((size_t)n * sizeof(*people));
    Person *buffer = malloc((size_t)n * sizeof(*buffer));
    for (int i = 0; i < n; ++i) scanf("%d %20s", &people[i].score, people[i].name);
    merge_sort(people, buffer, 0, n);
    for (int i = 0; i < n; ++i) printf("%d %s\n", people[i].score, people[i].name);
    free(buffer);
    free(people);
    return 0;
}`,
  bfs: String.raw`#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int height, width;
    if (scanf("%d %d", &height, &width) != 2) return 0;
    char **grid = malloc((size_t)height * sizeof(*grid));
    int total = height * width;
    int *distance = malloc((size_t)total * sizeof(*distance));
    int *queue = malloc((size_t)total * sizeof(*queue));
    for (int y = 0; y < height; ++y) {
        grid[y] = malloc((size_t)width + 1);
        scanf("%s", grid[y]);
    }
    for (int i = 0; i < total; ++i) distance[i] = -1;
    int head = 0, tail = 0;
    distance[0] = 1;
    queue[tail++] = 0;
    int dy[] = {1, -1, 0, 0}, dx[] = {0, 0, 1, -1};
    while (head < tail) {
        int current = queue[head++], y = current / width, x = current % width;
        for (int direction = 0; direction < 4; ++direction) {
            int ny = y + dy[direction], nx = x + dx[direction];
            if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
            int next = ny * width + nx;
            if (grid[ny][nx] == '0' && distance[next] == -1) {
                distance[next] = distance[current] + 1;
                queue[tail++] = next;
            }
        }
    }
    printf("%d", distance[total - 1]);
    for (int y = 0; y < height; ++y) free(grid[y]);
    free(grid); free(distance); free(queue);
    return 0;
}`,
  dfs: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    int vertices, edges;
    if (scanf("%d %d", &vertices, &edges) != 2) return 0;
    int *head = malloc((size_t)(vertices + 1) * sizeof(*head));
    int *to = malloc((size_t)(2 * edges) * sizeof(*to));
    int *next = malloc((size_t)(2 * edges) * sizeof(*next));
    int *stack = malloc((size_t)vertices * sizeof(*stack));
    unsigned char *seen = calloc((size_t)vertices + 1, 1);
    for (int i = 0; i <= vertices; ++i) head[i] = -1;
    int edge_index = 0;
    for (int i = 0; i < edges; ++i) {
        int a, b; scanf("%d %d", &a, &b);
        to[edge_index] = b; next[edge_index] = head[a]; head[a] = edge_index++;
        to[edge_index] = a; next[edge_index] = head[b]; head[b] = edge_index++;
    }
    int answer = 0;
    for (int start = 1; start <= vertices; ++start) {
        if (seen[start]) continue;
        ++answer;
        int size = 0; stack[size++] = start; seen[start] = 1;
        while (size > 0) {
            int node = stack[--size];
            for (int edge = head[node]; edge != -1; edge = next[edge])
                if (!seen[to[edge]]) { seen[to[edge]] = 1; stack[size++] = to[edge]; }
        }
    }
    printf("%d", answer);
    free(head); free(to); free(next); free(stack); free(seen);
    return 0;
}`,
  "union-find": String.raw`#include <stdio.h>
#include <stdlib.h>

static int find_root(int *parent, int node) {
    int root = node;
    while (parent[root] != root) root = parent[root];
    while (parent[node] != node) { int next = parent[node]; parent[node] = root; node = next; }
    return root;
}

int main(void) {
    int n, q;
    if (scanf("%d %d", &n, &q) != 2) return 0;
    int *parent = malloc((size_t)(n + 1) * sizeof(*parent));
    int *size = malloc((size_t)(n + 1) * sizeof(*size));
    for (int i = 1; i <= n; ++i) { parent[i] = i; size[i] = 1; }
    while (q--) {
        char command; int a, b;
        scanf(" %c %d %d", &command, &a, &b);
        int root_a = find_root(parent, a), root_b = find_root(parent, b);
        if (command == 'Q') puts(root_a == root_b ? "YES" : "NO");
        else if (root_a != root_b) {
            if (size[root_a] < size[root_b]) { int temp = root_a; root_a = root_b; root_b = temp; }
            parent[root_b] = root_a; size[root_a] += size[root_b];
        }
    }
    free(parent); free(size);
    return 0;
}`,
  "basic-dp": String.raw`#include <stdio.h>

int main(void) {
    int n;
    long long first, second;
    if (scanf("%d", &n) != 1 || scanf("%lld", &first) != 1) return 0;
    if (n == 1) { printf("%lld", first); return 0; }
    scanf("%lld", &second);
    long long previous_two = first, previous_one = second;
    for (int i = 2; i < n; ++i) {
        long long value; scanf("%lld", &value);
        long long current = (previous_two < previous_one ? previous_two : previous_one) + value;
        previous_two = previous_one;
        previous_one = current;
    }
    printf("%lld", previous_one);
    return 0;
}`,
} satisfies ReferenceSolutionSet;
