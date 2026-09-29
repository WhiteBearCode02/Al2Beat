import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "node_modules/pyodide");
const target = resolve(root, "public/vendor/pyodide");
const files = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "pyodide-lock.json", "python_stdlib.zip"];

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await Promise.all(files.map((file) => cp(resolve(source, file), resolve(target, file))));
