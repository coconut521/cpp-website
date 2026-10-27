#!/usr/bin/env node
/* v2 静态校验：本地链接、重复 id、章节骨架、JSON 数据块、JS 语法。
   用法：node v2/tools/validate-v2.mjs */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let errors = 0;
function err(file, msg) { errors++; console.log(`  [ERR] ${path.relative(ROOT, file)}: ${msg}`); }
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".git") continue;
      walk(full, out);
    } else out.push(full);
  }
  return out;
}
const all = walk(ROOT);
const htmlFiles = all.filter((f) => f.endsWith(".html"));
const jsFiles = all.filter((f) => f.endsWith(".js") && f.includes(`${path.sep}assets${path.sep}js${path.sep}`));
const idCache = new Map();
function idsOf(file) {
  if (idCache.has(file)) return idCache.get(file);
  const src = fs.readFileSync(file, "utf8");
  const ids = new Set();
  const re = /\bid\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) ids.add(m[1]);
  // 数据文件在运行时渲染出的锚点（速查表 / 报错 / 易错 / 找错）
  const base = path.basename(file);
  const dataMap = {
    "errors.html": ["errors-data.js"],
    "cheatsheets.html": ["cheatsheets-data.js"],
    "exam-pitfalls.html": ["pitfalls-data.js", "bughunt-data.js"]
  };
  for (const dataName of dataMap[base] || []) {
    const dataFile = path.join(ROOT, "assets/js", dataName);
    if (!fs.existsSync(dataFile)) continue;
    const data = fs.readFileSync(dataFile, "utf8");
    const reData = /\bid\s*:\s*["']([^"']+)["']/g;
    while ((m = reData.exec(data))) ids.add(m[1]);
  }
  idCache.set(file, ids);
  return ids;
}
function relExists(base, ref) {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean) return true;
  const target = path.resolve(path.dirname(base), decodeURIComponent(clean));
  return fs.existsSync(target);
}
for (const file of htmlFiles) {
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(ROOT, file);
  // duplicate ids
  const seen = new Set();
  const reId = /\bid\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = reId.exec(src))) {
    if (seen.has(m[1])) err(file, `重复 id: ${m[1]}`);
    seen.add(m[1]);
  }
  // local refs
  const reRef = /\b(?:href|src)\s*=\s*["']([^"']+)["']/g;
  while ((m = reRef.exec(src))) {
    const ref = m[1];
    if (!ref || ref.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) {
      if (ref.startsWith("#") && ref.length > 1) {
        const id = decodeURIComponent(ref.slice(1));
        if (!idsOf(file).has(id)) err(file, `同页锚点不存在: ${ref}`);
      }
      continue;
    }
    if (!relExists(file, ref)) err(file, `本地引用不存在: ${ref}`);
    else if (ref.includes("#")) {
      const [targetRel, hash] = ref.split("#");
      const target = path.resolve(path.dirname(file), decodeURIComponent(targetRel));
      if (target.endsWith(".html") && hash && !idsOf(target).has(decodeURIComponent(hash))) {
        err(file, `跨页锚点不存在: ${ref}`);
      }
    }
  }
  // JSON blocks
  const reJson = /<script\b[^>]*type\s*=\s*["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
  while ((m = reJson.exec(src))) {
    const body = m[1];
    if (/JSON\.stringify|<\\\/script>/.test(body)) continue; // 运行时拼接的 JSON 块
    try { JSON.parse(body); } catch (e) { err(file, `JSON 解析失败: ${e.message}`); }
  }
  // chapter skeleton
  if (rel.startsWith("chapters" + path.sep)) {
    for (const need of ["学习目标", "本章小结", "自测清单", 'class="quiz"']) {
      if (!src.includes(need)) err(file, `缺少章节必需内容: ${need}`);
    }
    for (const js of ["highlight.js", "toc.js", "nav.js", "quiz.js", "interactive.js", "teacher.js", "mastery.js", "v2-config.js", "v2-core.js", "v2-lab.js"]) {
      if (!src.includes(`assets/js/${js}`)) err(file, `缺少脚本: ${js}`);
    }
  }
}
// JS syntax
for (const file of jsFiles) {
  const r = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (r.status !== 0) err(file, `JS 语法错误: ${r.stderr.split("\n").slice(0, 2).join(" ")}`);
}
console.log(errors ? `\n${errors} error(s)` : `\nOK: ${htmlFiles.length} HTML, ${jsFiles.length} JS`);
process.exit(errors ? 1 : 0);
