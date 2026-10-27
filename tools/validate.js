#!/usr/bin/env node
/* ============================================================
 * validate.js —— 全站静态校验（node tools/validate.js [文件...])
 * 不带参数时校验：全部 HTML + 全部 JS + toc.js 目录一致性
 * 检查项：
 *   1. 本地 href/src 引用是否存在（防 404，file:// 同样适用）
 *   2. <pre><code> 内容里的 < > & 是否转义（未转义报错）
 *   3. 未知 HTML 标签（白名单）
 *   4. 严格 JSON 数据块可解析（quiz-data / ex-steps / mem-data / sort-data）
 *   5. quiz 数据 schema 基本校验
 *   6. 同页/跨页锚点存在；同页 id 重复
 *   7. 章节页必需小节（学习目标/本章小结/自测清单/quiz）与 7 个脚本引用
 *   8. toc.js 列出的章节文件存在；chapters/ 下页面都已列入目录
 *   9. 所有 assets/js/*.js 通过 node --check 语法检查
 * ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const ALLOWED_TAGS = new Set(("html head body meta title link script style main nav header footer section article " +
  "div h1 h2 h3 h4 h5 h6 p ul ol li table thead tbody tr th td pre code span strong em b i small sup sub mark " +
  "details summary label input button textarea select option a br hr img kbd blockquote figure figcaption").split(" "));

let errors = 0, warnings = 0;
function err(file, line, msg) { errors++; console.log(`  ❌ [${path.relative(ROOT, file)}:${line || "?"}] ${msg}`); }
function warn(file, line, msg) { warnings++; console.log(`  ⚠️  [${path.relative(ROOT, file)}:${line || "?"}] ${msg}`); }

function lineOf(src, idx) { return src.slice(0, idx).split("\n").length; }

/* ---------- HTML 检查 ---------- */
function checkHtml(file) {
  const src = fs.readFileSync(file, "utf8");
  const base = path.basename(file);
  const ids = new Set();
  const hrefs = [];
  const jsonBlocks = [];

  // 1) 摘出 script 块（原始文本）
  let work = src.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m0, attrs, body, off) => {
    if (/type\s*=\s*["']application\/json["']/i.test(attrs)) jsonBlocks.push({ body, off });
    return "";
  });

  // 2) 摘出 pre 块，检查 code 内容转义
  work = work.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/gi, (m0, inner, off) => {
    const cm = inner.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
    if (cm) {
      const codeText = cm[1];
      const bad = codeText.match(/<(?!\/code)[a-zA-Z!/]/g);
      if (bad) {
        const firstBad = codeText.search(/<(?!\/code)[a-zA-Z!/]/);
        err(file, lineOf(src, off + inner.indexOf(codeText) + firstBad),
          `代码块中存在未转义的 "<" —— 请把 < 写成 &lt;（上下文：${codeText.slice(Math.max(0, firstBad - 25), firstBad + 25).replace(/\n/g, "⏎")}）`);
      }
      if (/&(?!amp;|lt;|gt;|quot;|#\d+;|#x[0-9a-fA-F]+;)/.test(codeText)) {
        err(file, lineOf(src, off), `代码块中存在未转义的 "&" —— 请把 & 写成 &amp;`);
      }
    }
    return "";
  });

  // 3) 剩余标签白名单 + 收集 id/href/src
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)(\/?)>/g;
  let t;
  while ((t = tagRe.exec(work))) {
    const [full, close, name, attrs] = t;
    if (!ALLOWED_TAGS.has(name.toLowerCase())) {
      err(file, lineOf(src, t.index), `未知标签 <${name}> —— 可能是代码未转义或拼写错误`);
    }
    if (!close) {
      const idm = attrs.match(/\bid\s*=\s*["']([^"']+)["']/);
      if (idm) {
        if (ids.has(idm[1])) warn(file, lineOf(src, t.index), `重复 id "${idm[1]}"`);
        ids.add(idm[1]);
      }
      const hm = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/);
      if (hm) hrefs.push({ url: hm[1], off: t.index });
      const sm = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/);
      if (sm) hrefs.push({ url: sm[1], off: t.index });
    }
  }

  // 4) JSON 数据块
  for (const jb of jsonBlocks) {
    let data = null;
    try { data = JSON.parse(jb.body); }
    catch (e) { err(file, lineOf(src, jb.off), `JSON 块解析失败：${e.message}（注意：不许注释/尾逗号）`); continue; }
    const kind = (jb.body && src.slice(jb.off - 200, jb.off).match(/class\s*=\s*["']([\w-]+)["']/) || [])[1] || "";
    if (data && data.questions) {
      data.questions.forEach((q, i) => {
        const at = `题目${i + 1}`;
        if (!q.q) err(file, lineOf(src, jb.off), `quiz ${at} 缺少题干 q`);
        if (q.type === "mcq") {
          if (!Array.isArray(q.options) || q.options.length < 2) err(file, 0, `quiz ${at} mcq 缺少 options`);
          else if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.options.length) err(file, 0, `quiz ${at} mcq answer 索引越界`);
        } else if (q.type === "tf") {
          if (typeof q.answer !== "boolean") err(file, 0, `quiz ${at} tf answer 必须是 true/false`);
        } else if (q.type === "fill" || q.type === "code") {
          const a = q.answer;
          const ok = typeof a === "string" ? a.length > 0 : Array.isArray(a) && a.length > 0;
          if (!ok) err(file, 0, `quiz ${at} ${q.type} 缺少 answer`);
        } else if (q.type === "mfill") {
          if (typeof q.code !== "string" || !q.code) err(file, 0, `quiz ${at} mfill 缺少 code`);
          const nSlots = (typeof q.code === "string" ? q.code : "").split(/_{4,}/).length - 1;
          if (!Array.isArray(q.blanks) || q.blanks.length === 0) {
            err(file, 0, `quiz ${at} mfill 缺少 blanks 数组`);
          } else if (nSlots !== q.blanks.length) {
            err(file, 0, `quiz ${at} mfill：code 中有 ${nSlots} 个 ____，blanks 有 ${q.blanks.length} 项，数量不一致`);
          } else {
            q.blanks.forEach((b, bi) => {
              const a = b && b.answer;
              const ok = typeof a === "string" ? a.length > 0 : Array.isArray(a) && a.length > 0;
              if (!ok) err(file, 0, `quiz ${at} mfill 第${bi + 1}空缺少 answer`);
            });
          }
        } else {
          err(file, 0, `quiz ${at} 未知题型 "${q.type}"`);
        }
      });
    }
    if (data && data.steps) {
      data.steps.forEach((s, i) => {
        if (typeof s.line !== "number") err(file, 0, `ex-steps 第${i + 1}步缺少数字 line`);
        if (s.vars && typeof s.vars !== "object") err(file, 0, `ex-steps 第${i + 1}步 vars 必须是对象`);
      });
    }
    if (data && data.regions && !Array.isArray(data.regions)) err(file, 0, `mem-data.regions 必须是数组`);
    if (data && data.items && !Array.isArray(data.items)) err(file, 0, `sort-data.items 必须是数组`);
  }

  // 5) 链接检查（chapter-template.html 会被复制到 chapters/ 下使用，
  //    其“同级章节链接”在当前位置不存在属正常，跳过存在性检查）
  const isTemplate = /chapter-template\.html$/.test(file);
  for (const h of hrefs) {
    const u = h.url;
    if (/^(https?:|mailto:|data:|javascript:)/i.test(u)) continue;
    const [filePart, hash] = u.split("#");
    if (filePart) {
      if (isTemplate) continue;
      const target = path.resolve(path.dirname(file), decodeURIComponent(filePart));
      if (!fs.existsSync(target)) err(file, lineOf(src, h.off), `链接 404：${u}`);
      else if (hash) crossPageAnchors.push({ from: file, to: target, hash, off: h.off, url: u });
      if (/assets\/vendor\//.test(u)) warn(file, 0, `引用了 assets/vendor/ —— 请确认该目录存在`);
    } else if (hash) {
      if (!ids.has(hash)) err(file, lineOf(src, h.off), `同页锚点不存在：#${hash}`);
    }
  }

  // 6) 章节页结构
  const inChapters = /[/\\]chapters[/\\]/.test(file);
  if (inChapters && base !== "chapter-template.html") {
    for (const need of ["学习目标", "本章小结", "自测清单"]) {
      if (!src.includes(need)) err(file, 0, `章节页缺少必需小节「${need}」`);
    }
    if (!/class="quiz"/.test(src)) err(file, 0, `章节页缺少随堂测验 <section class="quiz">`);
    for (const js of ["highlight.js", "toc.js", "nav.js", "quiz.js", "interactive.js", "teacher.js", "mastery.js"]) {
      if (!src.includes(`assets/js/${js}`)) err(file, 0, `章节页未引用 assets/js/${js}`);
    }
    const cardIds = [...src.matchAll(/class="example-card"\s+id="([^"]+)"/g)].map(m => m[1]);
    const dup = cardIds.filter((v, i) => cardIds.indexOf(v) !== i);
    if (dup.length) err(file, 0, `示例卡片 id 重复：${dup.join(", ")}`);
    const nCards = (src.match(/class="example-card"/g) || []).length;
    if (nCards < 8) warn(file, 0, `示例卡片只有 ${nCards} 个（建议 8~15）`);
    const steps = (src.match(/class="ex-steps"/g) || []).length;
    if (steps < 2) warn(file, 0, `ex-steps 只有 ${steps} 个（建议 ≥2，用于逐步执行）`);
  }
}

/* ---------- 跨页锚点（第二轮） ---------- */
const crossPageAnchors = [];
/* 数据驱动页面的条目 id 由 JS 在运行时写入 DOM（如 cheatsheets.html 的 cs-xxx），
 * 静态 HTML 里不存在但真实可跳转——从对应数据文件补齐合法锚点集合。
 * require 只允许字面量路径（静态可审计）：经此白名单分发 */
const DATA_REQUIRE_WHITELIST = {
  "../assets/js/cheatsheets-data.js": () => require("../assets/js/cheatsheets-data.js"),
  "../assets/js/errors-data.js": () => require("../assets/js/errors-data.js"),
  "../assets/js/pitfalls-data.js": () => require("../assets/js/pitfalls-data.js"),
  "../assets/js/bughunt-data.js": () => require("../assets/js/bughunt-data.js")
};
const DYNAMIC_ID_PAGES = {
  "cheatsheets.html": [["../assets/js/cheatsheets-data.js", "CHEATSHEETS_DATA"]],
  "errors.html": [["../assets/js/errors-data.js", "ERRORS_DATA"]],
  "exam-pitfalls.html": [
    ["../assets/js/pitfalls-data.js", "PITFALLS_DATA"],
    ["../assets/js/bughunt-data.js", "BUGHUNT_DATA"]
  ]
};
function loadModule(rel) {
  const loader = DATA_REQUIRE_WHITELIST[rel];
  if (!loader) return null;
  global.window = global.window || {};   /* 数据文件以 window.XXX 形式挂载 */
  delete require.cache[require.resolve(rel)];
  return loader();
}
function dynamicIdsFor(file) {
  const base = path.basename(file);
  const sources = DYNAMIC_ID_PAGES[base];
  if (!sources) return null;
  const ids = new Set();
  for (const [rel, dataKey] of sources) {
    try {
      const data = (loadModule(rel) && global.window[dataKey]) || [];
      for (const d of data) if (d && d.id) ids.add(d.id);
    } catch (e) { /* 数据文件损坏时跳过该来源，不阻断其余校验 */ }
  }
  return ids;
}
function verifyCrossPageAnchors(allFiles) {
  const idMap = {};
  for (const f of allFiles) {
    if (!/\.html$/.test(f)) continue;
    const src = fs.readFileSync(f, "utf8");
    const set = new Set();
    for (const m of src.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)) set.add(m[1]);
    idMap[path.resolve(f)] = set;
  }
  for (const ref of crossPageAnchors) {
    const dyn = dynamicIdsFor(ref.to);
    const ok = idMap[ref.to] && (idMap[ref.to].has(ref.hash) || (dyn && dyn.has(ref.hash)));
    if (!ok) {
      err(ref.from, 0, `跨页锚点不存在：${ref.url}#${ref.hash}`);
    }
  }
}

/* ---------- toc.js 一致性 ---------- */
function checkToc() {
  const tocFile = path.join(ROOT, "assets", "js", "toc.js");
  if (!fs.existsSync(tocFile)) { err(tocFile, 0, "缺少 assets/js/toc.js"); return; }
  delete require.cache[require.resolve("../assets/js/toc.js")];
  global.window = {};
  try { require("../assets/js/toc.js"); } catch (e) { err(tocFile, 0, `toc.js 执行失败：${e.message}`); return; }
  const toc = global.window.COURSE_TOC || [];
  for (const item of toc) {
    if (!item.id || !item.title || !item.file) { err(tocFile, 0, `目录项缺少 id/title/file：${JSON.stringify(item).slice(0, 80)}`); continue; }
    if (!fs.existsSync(path.join(ROOT, item.file))) err(tocFile, 0, `目录指向不存在的文件：${item.file}`);
  }
  const listed = new Set(toc.map(i => path.basename(i.file)));
  const chDir = path.join(ROOT, "chapters");
  for (const f of fs.readdirSync(chDir)) {
    if (f.endsWith(".html") && f !== "chapter-template.html" && !listed.has(f)) {
      warn(path.join(chDir, f), 0, `chapters/ 下的页面未列入 toc.js 目录`);
    }
  }
  console.log(`  ℹ️  toc.js 共 ${toc.length} 章`);
}

/* ---------- 主流程 ---------- */
const target = process.argv.slice(2);
let files = [];
if (target.length) {
  files = target.map(t => path.resolve(t));
} else {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
    const p = path.join(d, e.name);
    return e.isDirectory() && !["node_modules", ".git", "tools"].includes(e.name) ? walk(p) : [p];
  });
  files = walk(ROOT);
}

console.log(`开始校验 ${files.filter(f => f.endsWith(".html")).length} 个 HTML 文件…`);
for (const f of files) {
  if (!f.endsWith(".html")) continue;
  if (!fs.existsSync(f)) { err(f, 0, "文件不存在"); continue; }
  process.stdout.write(`  校验 ${path.relative(ROOT, f)}\n`);
  checkHtml(f);
}
verifyCrossPageAnchors(files.filter(f => f.endsWith(".html")));

if (!target.length) {
  console.log("校验 toc.js 一致性…");
  checkToc();
  console.log("JS 语法检查（node --check）…");
  const jsDir = path.join(ROOT, "assets", "js");
  for (const f of fs.readdirSync(jsDir)) {
    if (!f.endsWith(".js")) continue;
    const r = spawnSync(process.execPath, ["--check", path.join(jsDir, f)], { encoding: "utf8" });
    if (r.status !== 0) err(path.join(jsDir, f), 0, `语法错误：${(r.stderr || "").split("\n")[0]}`);
    else console.log(`  ✅ ${f}`);
  }
}

console.log(`\n完成：${errors} 个错误，${warnings} 个警告`);
process.exit(errors ? 1 : 0);
