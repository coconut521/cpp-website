#!/usr/bin/env node
/* ============================================================
 * gen-embed.mjs —— 把 assets/wasm/cpprun.wasm 生成为
 * assets/js/cpprun-wasm-embed.js（base64 内嵌版，file:// 用）
 * 用法：node tools/gen-embed.mjs
 * ============================================================ */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wasm = readFileSync(join(root, "assets", "wasm", "cpprun.wasm"));
const b64 = Buffer.from(wasm).toString("base64");

const out = `/* ============================================================
 * cpprun-wasm-embed.js —— cpprun.wasm 的 base64 内嵌版（自动生成，勿手改）
 * 由 tools/gen-embed.mjs 从 assets/wasm/cpprun.wasm 生成。
 * 用途：file:// 协议下无法 fetch 本地文件，由此脚本把 WASM 字节
 * 交给 cpp-run.js 实例化；https/http 下优先走分离的 .wasm 文件。
 * ============================================================ */
window.__CPPRUN_WASM_B64 = "${b64}";
`;

writeFileSync(join(root, "assets", "js", "cpprun-wasm-embed.js"), out);
console.log(`generated assets/js/cpprun-wasm-embed.js (${(out.length / 1024).toFixed(1)} KB, wasm ${(wasm.length / 1024).toFixed(1)} KB)`);
