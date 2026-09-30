import { randomUUID } from "node:crypto";

const CONFIRMATION = "VERIFY_FOUR_SERVER_LANGUAGES";
const confirmation = process.env.AL2BEAT_CONFIRM_PRODUCTION_USAGE;
const productionUrl = process.env.AL2BEAT_PRODUCTION_URL;

if (confirmation !== CONFIRMATION) {
  throw new Error(`Set AL2BEAT_CONFIRM_PRODUCTION_USAGE=${CONFIRMATION} only after checking the Vercel Sandbox allowance.`);
}

if (!productionUrl) {
  throw new Error("Set AL2BEAT_PRODUCTION_URL to the deployed HTTPS origin.");
}

const origin = new URL(productionUrl);
const localDevelopmentOrigin = origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname);
if ((!localDevelopmentOrigin && origin.protocol !== "https:") || origin.pathname !== "/" || origin.search || origin.hash) {
  throw new Error("AL2BEAT_PRODUCTION_URL must be an HTTPS origin or an HTTP localhost origin without a path, query, or hash.");
}

const sources = {
  c: `#include <stdio.h>
#include <string.h>

int main(void) {
  char input[100001], stack[100001];
  if (scanf("%100000s", input) != 1) return 0;
  int top = 0, valid = 1;
  for (size_t i = 0; input[i] && valid; i++) {
    char current = input[i];
    if (current == '(' || current == '[' || current == '{') stack[top++] = current;
    else if (top == 0) valid = 0;
    else {
      char open = stack[--top];
      valid = (open == '(' && current == ')') || (open == '[' && current == ']') || (open == '{' && current == '}');
    }
  }
  puts(valid && top == 0 ? "YES" : "NO");
  return 0;
}`,
  cpp: `#include <iostream>
#include <string>
#include <vector>

int main() {
  std::string input;
  std::cin >> input;
  std::vector<char> stack;
  bool valid = true;
  for (char current : input) {
    if (current == '(' || current == '[' || current == '{') stack.push_back(current);
    else if (stack.empty()) { valid = false; break; }
    else {
      char open = stack.back();
      stack.pop_back();
      if (!((open == '(' && current == ')') || (open == '[' && current == ']') || (open == '{' && current == '}'))) {
        valid = false;
        break;
      }
    }
  }
  std::cout << (valid && stack.empty() ? "YES" : "NO") << '\\n';
}`,
  java: `import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
  public static void main(String[] args) throws Exception {
    String input = new BufferedReader(new InputStreamReader(System.in)).readLine().trim();
    Deque<Character> stack = new ArrayDeque<>();
    boolean valid = true;
    for (char current : input.toCharArray()) {
      if (current == '(' || current == '[' || current == '{') stack.push(current);
      else if (stack.isEmpty()) { valid = false; break; }
      else {
        char open = stack.pop();
        if (!((open == '(' && current == ')') || (open == '[' && current == ']') || (open == '{' && current == '}'))) {
          valid = false;
          break;
        }
      }
    }
    System.out.println(valid && stack.isEmpty() ? "YES" : "NO");
  }
}`,
  csharp: `using System;
using System.Collections.Generic;

public static class Program
{
    public static void Main()
    {
        string input = (Console.ReadLine() ?? string.Empty).Trim();
        var stack = new Stack<char>();
        bool valid = true;
        foreach (char current in input)
        {
            if (current == '(' || current == '[' || current == '{') stack.Push(current);
            else if (stack.Count == 0) { valid = false; break; }
            else
            {
                char open = stack.Pop();
                if (!((open == '(' && current == ')') || (open == '[' && current == ']') || (open == '{' && current == '}')))
                {
                    valid = false;
                    break;
                }
            }
        }
        Console.WriteLine(valid && stack.Count == 0 ? "YES" : "NO");
    }
}`,
};

const requestedLanguages = process.env.AL2BEAT_VERIFY_LANGUAGES
  ? process.env.AL2BEAT_VERIFY_LANGUAGES.split(",").map((language) => language.trim()).filter(Boolean)
  : Object.keys(sources);
const unsupportedLanguages = requestedLanguages.filter((language) => !(language in sources));
if (unsupportedLanguages.length > 0) {
  throw new Error(`Unsupported verification languages: ${unsupportedLanguages.join(", ")}`);
}

const entries = requestedLanguages.map((language) => [language, sources[language]]);
for (let index = 0; index < entries.length; index++) {
  const [language, source] = entries[index];
  const response = await fetch(new URL("/api/execute", origin), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action: "submit",
      problemId: "stack",
      language,
      source,
      input: "",
      idempotencyKey: `production-verification-${randomUUID()}`,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const body = await response.json();
  if (!response.ok || !body.ok || body.result?.status !== "accepted") {
    throw new Error(`${language} verification failed (${response.status}): ${JSON.stringify(body)}`);
  }
  console.log(`${language}: accepted (${body.result.passed}/${body.result.total} tests)`);
  if (index < entries.length - 1) await new Promise((resolve) => setTimeout(resolve, 21_000));
}
