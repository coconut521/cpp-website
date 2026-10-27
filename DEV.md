# DEV.md — Development Guide

For developers who want to **modify or extend** this site. For the user guide see [README.md](README.md) (Chinese: [README.zh-CN.md](README.zh-CN.md)).

## 1. Technical constraints (read this first)

- **Pure static, zero dependencies**: HTML5 + CSS3 + vanilla JS (ES2017+, modern browsers). No framework, no build step, no package manager.
- **Must work over `file://`**: therefore *no* ES modules, no local `fetch()` of JSON, no CDN. All data lives as `window.XXX = [...]` globals in `assets/js/*-data.js`, loaded via plain `<script>` tags in order.
- **Zero network requests**: no external fonts, icons, or images.
- Site copy is Simplified Chinese; files are UTF-8.

## 2. Layout

```text
index.html                 Home (search + topics + catalog + learning progress + recent updates)
errors.html                Compiler-error museum (51 entries, incl. Visual Studio 2026 issues)
sorting.html               Sorting special topic (7 sorts + steppers + comparison table + quiz)
cheatsheets.html           Cheat sheets (19 sheets + quick-jump buttons)
exam-pitfalls.html         Exam pitfalls (20 topics + random practice)
chapters/ch01…ch12.html    12 lecture chapters
templates/
  chapter-template.html    New-chapter template
  authoring-guide.md       Component authoring guide (example cards / steppers / memory viz …)
assets/
  css/style.css            Site-wide styles (CSS variables, dark mode, print styles)
  js/theme-init.js         Theme & font-size bootstrap (loaded synchronously in <head>;
                           light/dark/auto follow-system; exposes window.SiteTheme)
  js/highlight.js          Home-grown C++ syntax highlighting (exposes window.CppLight)
  js/toc.js                Catalog data COURSE_TOC + topics SPECIAL_PAGES
  js/nav.js                Top bar / footer / pager / theme & font controls (exposes window.SiteUI)
  js/quiz.js               Quiz engine (exposes window.Quiz)
  js/interactive.js        Example-card buttons, steppers, memory viz, drag sort,
                           inc/dec animation (window.Interact)
  js/teacher.js            Teacher mode
  js/mastery.js            Knowledge-point marking (know / don't know) +
                           top-bar "weak points" summary panel
  js/bughunt-data.js       Bug-hunt exercise bank BUGHUNT_DATA (window.BugHunt)
  js/bug-hunt.js           "Bug hunt" find-the-error widget; auto-inserts a per-chapter
                           section on chapter pages (exposes window.BugHunt)
  js/present.js            Presentation mode: section-per-slide projection, HUD,
                           keyboard paging, fullscreen (exposes window.Present)
  js/glossary-data.js      Glossary terms GLOSSARY_DATA
  js/glossary.js           Glossary tooltips: marks first occurrence per term in prose,
                           hover explanation, click-through (exposes window.Glossary)
  js/page-toc.js           Floating in-page TOC: h2 sections of main, left-edge tab,
                           click-to-scroll + scrollspy; hidden < 1200px / in
                           presentation mode / in print (exposes window.PageToc)
  js/quizbank-data.js      跨章题库 QUIZBANK_DATA（随机组卷数据源之一；题目含 difficulty）
  js/errors-data.js        Error museum data ERRORS_DATA
  js/cheatsheets-data.js   Cheat-sheet data CHEATSHEETS_DATA
  js/pitfalls-data.js      Pitfalls data PITFALLS_DATA
  js/cpp-run.js            在线运行入口（window.CppRun）：双协议加载 WASM +
                           canRun 启发式 + run()；由 interactive.js 按需动态注入
  js/cpprun-wasm-embed.js  cpprun.wasm 的 base64 内嵌版（tools/gen-embed.mjs 生成，勿手改）
  assets/wasm/cpprun.wasm  教学子集解释器（AssemblyScript 编译产物）
tools/validate.js          Site-wide static validation
tools/cpprun-src/interpreter.ts   WASM 解释器源码（AssemblyScript）
tools/gen-embed.mjs        生成 cpprun-wasm-embed.js（npm run build:cpprun 的后半步）
tools/test-cpprun.mjs      解释器 node 直测（npm run test:cpprun，22 例）
README.md / README.zh-CN.md / DEV.md
```

Every page is just "skeleton + page-local `<style>` + a bit of glue"; all shared behavior lives in `assets/js/`.

## 3. Key mechanisms (cheat sheet)

| Mechanism | Notes |
| --- | --- |
| Syntax highlighting | `highlight.js` scans `pre code.cpp` and tokenizes via keyword/string regexes; copy buttons use the pre-highlight source (`data-raw`); line numbers come from CSS counters and are `user-select: none` |
| Navigation | `nav.js` inserts the top bar and footer; chapter pages get prev/next from `COURSE_TOC`; pages in subdirectories get the `../` prefix automatically |
| Theme | `theme-init.js` (in `<head>`) sets `data-theme` from `cppcourse.theme` (`light` / `dark` / `auto`); `auto` follows `prefers-color-scheme` and reacts to live OS switching. The nav button cycles the three states; all decisions go through `window.SiteTheme` |
| Search | The home page builds one corpus array from the 5 data files; plain `indexOf` matching, no index |
| Teacher mode | `body.teacher` class + `?teacher=1` + `Ctrl+Alt+T`; answers are revealed via `body.teacher-show-answers` |
| Learning progress | Home page only: checkboxes write `localStorage["cppcourse.progress"]` (JSON array of chapter ids); the progress bar renders done/total |
| Knowledge-point marking | `mastery.js` turns each chapter's learning-objective and self-check `li` items into "know / don't know" chips (checklist checkboxes are removed at runtime). Stored in `localStorage["cppcourse.mastery"]`, keyed by item id (`data-check-id` for checklists, generated `chXX-obj-N` for objectives); values carry the item text and chapter info so the top-bar panel can summarize across pages |
| Bug hunt | Data lives in `bughunt-data.js`; the engine renders `<section class="bug-hunt" data-ch="chNN">` blocks (data-ch omitted = all). On `/chapters/` pages it auto-inserts a "火眼金睛" section before the quiz when the current chapter has exercises (skipped if a manual block exists). Code lines are highlighted via `CppLight.highlight`, so each line carries `.ln[data-n]`; judging marks the picked line `.bh-miss` and the bug line `.bh-hit`. `data-shuffle="1"` adds a shuffle button that re-reads cards from the DOM (never from a cached array — redo replaces nodes) |
| Presentation mode | `present.js` groups `main.container`'s direct children into slides at `h2` / `.section-head` boundaries and tags them `data-pslide`; only the current slide's group keeps `.p-cur` (CSS hides the rest, nothing is moved). Entering scales `html` font-size ×1.15 and restores it on exit; `Esc` leaves fullscreen first when in fullscreen, then exits the mode. `?present=1` enters without fullscreen |
| Glossary tooltips | `glossary.js` walks text nodes under `main` (skipping `pre/code/a/h1/buttons/.mk-chips/...`), wraps the first occurrence of each term per page as `.term` (an `<a>` when the entry has `href`), and shows one shared `.term-tip` bubble. Matching is longest-first (so 纯虚函数 wins over 虚函数) with word-boundary checks for ASCII aliases (UB / RAII / lambda) |
| Stepper（增强） | `interactive.js` 扫描 `pre code.cpp` 逐步执行；除行高亮/变量表/控制台外，还支持：**▶ 自动播放 + 速度档**（控件行）、**调用栈侧栏**（`step.stack`：字符串数组，底→顶）、**柱状图**（`step.vars` 里键名以 `[]` 结尾、值为空格分隔数字的项；`step.cmp` 橙色标比较下标、`step.pivot` 红色标基准下标） |
| Parsons 问题 | `.widget-parsons` + `script.parsons-data`（`items` 正确顺序的代码行 / `hint` / `explain`）。双栏：左「代码块（打乱）」右「程序区」，拖拽或 ↑↓✕ 按钮；「检查顺序」从第一个错行开始定位。渲染用 `esc()`，行内容为纯文本（`white-space: pre` 保留缩进） |
| 多空代码填空 | quiz 题型 `mfill`：`code`（多行代码，空位写成 `____`，≥4 个下划线）+ `blanks:[{answer, ci?}]`（按出现顺序对应每个空）。判分逐空进行、绿/红边框标对错；validate.js 校验 `____` 数量与 blanks 数量一致 |
| 指针指向图 | `.widget-ptrviz` + `script.ptrviz-data`（`vars` 变量盒 + `frames` 每步 `ptrs`/`freed`/`note`；字段名避开 `steps`——validate.js 对 ex-steps 的 `steps` 有 line 校验）。SVG 箭头从指针盒顶部弧线到目标盒顶部；`"null"` 画 ∅ 徽标；`freed` 盒子打删除线、指向它的箭头变红虚线（悬空）。箭头用 stroke-dashoffset 生长动画（虚线箭头除外） |
| 随机组卷 | 教师面板「📑 随机组卷」：题源 = `QUIZBANK_DATA`（quizbank-data.js）+ `PITFALLS_DATA[].quiz` + `BUGHUNT_DATA`，三者均支持可选 `difficulty: "easy"/"medium"/"hard"`（pitfalls 小题继承其专题的难度）。按 题数/难度/题型/章节 随机抽取，全屏浮层渲染试卷与答案页；`@media print` 下 `body.exam-open` 只打印浮层。数据文件按需动态注入 `<script>`（file:// 可用） |
| 在线运行 | 示例卡通过启发式（含 `int main`、无 class/vector/string/cin 等）显示「▶ 在线运行」；点击时动态注入 `cpp-run.js`，其 `CppRun.ensure` 按协议加载 WASM：**https/http → fetch `assets/wasm/cpprun.wasm`（分离文件）**，**file: → 注入 `cpprun-wasm-embed.js`（base64 内嵌版）**，https 失败也回退内嵌版。解释器为教学子集（AssemblyScript，源码 `tools/cpprun-src/interpreter.ts`），UB（未初始化读取/有符号溢出/整除零/数组越界/递归过深）会警告或报错停止。构建：`npm run build:cpprun`；测试：`npm run test:cpprun`（node 直测，22 例） |
| Floating page TOC | `page-toc.js` collects the `h2` headings of `main.container` (auto-id `ptoc-N`, hidden headings excluded), renders a left-edge vertical tab + panel, scrolls via `scrollIntoView` (global `scroll-padding-top` keeps the sticky header clear) and highlights the current section on scroll (rAF-throttled, bottom-clamped). Shows only with ≥3 sections, window ≥1200px, and outside presentation mode (watched via a body-class MutationObserver) |
| Storage keys | Shared prefix `cppcourse.`: `theme` (`light`/`dark`/`auto`), `fontscale` (0.8–1.4), `progress`, `mastery`. Every access is wrapped in try/catch (some `file://` environments block storage) |
| HTML injection | `title` fields are mostly `esc()`'d on render; but **`desc`, table `rows` cells, and `items[].desc` are inserted as raw HTML** — write `&lt;` `&gt;` to show angle brackets (see §5) |

## 4. Common tasks

### 4.1 Adding a chapter

1. Copy `templates/chapter-template.html` to `chapters/chNN-short-name.html`.
2. Fill in the components per `templates/authoring-guide.md` (example cards, steppers, quiz …).
3. Append an entry to `COURSE_TOC` in `assets/js/toc.js` (`id / title / file / desc / keywords / updated`).
4. Run `node tools/validate.js`.

Navigation, catalog, search, and the pager pick the chapter up automatically. Chapter pages have hard requirements (the validator checks them):

- Must contain the section headings 「学习目标」 (objectives), 「本章小结」 (summary), 「自测清单」 (self-check) — literal Chinese, the validator greps for them — plus one `<section class="quiz">`;
- Must reference the 7 shared scripts (highlight / toc / nav / quiz / interactive / teacher / mastery) and keep `theme-init.js` in `<head>`;
- `class="example-card"` ids must be unique; aim for 8–15 example cards and ≥2 `ex-steps`.

### 4.2 Adding a cheat sheet

Append an object to `assets/js/cheatsheets-data.js`. Common fields:

```js
{
  id: "cs-xxx",            // in-page anchor, must be unique; prefer the cs- prefix
  title: "Sheet title",    // escaped with esc() on render
  category: "Category",    // drives the category filter chips; new categories appear automatically
  short: "Short label",    // text on the quick-jump button; falls back to title
  desc: "One-line blurb",  // inserted as raw HTML — use entities for angle brackets
  type: "table" | "code" | "items",
  // table  →  header: [...], rows: [[...], ...]
  // code   →  code: `...`,  notes: ["...", ...]
  // items  →  items: [{ code: "...", desc: "..." }, ...]
  tip: "Green tip box at the bottom"   // optional
}
```

Array order = page order = quick-jump button order. Run `node tools/validate.js` afterwards (it syntax-checks the JS).

### 4.3 Adding error / pitfall entries

Append objects to `errors-data.js` / `pitfalls-data.js` respectively. Fields **follow the in-file comments and existing entries** (an error entry needs at least `id/title/message/cause/bad`; a pitfall at least `id/title/tags/why/examQ`). The home-page search picks up new entries automatically.

### 4.4 Adding bug-hunt exercises / glossary terms

- **Bug hunt**: append an object to `assets/js/bughunt-data.js` — `{ id: "bh-chNN-NN" (unique, used as page anchor), ch, title, kind: "compile" | "logic" | "ub", code: [one string per line, raw text], bugLine (1-based), hint?, why (raw HTML) }`. Chapter pages pick it up automatically on the next load; the pitfalls page and home search too. Keep the teaching principle: UB questions never imply a deterministic output.
- **Glossary**: append `{ term, aliases?, detail (raw HTML), href? }` to `assets/js/glossary-data.js`. Terms appear as tooltips on every page (first occurrence only); entries with `href` are also searchable on the home page. Mind the per-term length interplay: a new term that contains an existing one (e.g. adding 迭代器失效 next to 迭代器) is matched longest-first automatically.

### 4.5 Styling

- Site-wide variables and the dark theme live in `style.css` under `:root` / `html[data-theme="dark"]`; add colors via CSS variables, never hard-code them.
- Page-specific styles go in that page's `<style>` block (e.g. the cheat-sheet quick-jump row, the home progress bar).
- Print styles: global rules in `style.css` under `@media print`; page-specific print hiding goes in the page's own `<style>`.

### 4.6 随机组卷（教师）

- 题源三处：`quizbank-data.js`（每题 `{ id: "qb-…", ch, type, q, options?, answer, explain, difficulty, tags }`）、`pitfalls-data.js` 各专题的 `quiz` 小题（难度继承所在专题）、`bughunt-data.js` 找错题。给任一来源补题只需按各自格式追加；`difficulty` 缺省按中等处理。
- 生成流程不需要改任何页面：teacher.js 会按需动态注入缺失的数据 `<script>`，任何页面（含 file://）都能组卷。
- 出卷/答案页的打印走 `body.exam-open` 的 `@media print` 规则（只打印浮层）；若改打印样式，注意别破坏该规则。

### 4.7 在线运行（WASM C++ 子集解释器）

- 解释器源码在 `tools/cpprun-src/interpreter.ts`（AssemblyScript），产物 `assets/wasm/cpprun.wasm` + 内嵌版 `assets/js/cpprun-wasm-embed.js`。改完解释器：`npm run build:cpprun` 重新生成两个文件，再 `npm run test:cpprun` 跑 22 例直测（保持全绿）。
- 加载策略见 `cpp-run.js`：https/http 走 fetch 分离 wasm；file: 与加载失败时回退 base64 内嵌版。**改 wasm 后两个文件必须同时重新生成**，否则 file:// 与 https 行为不一致。
- 示例卡是否显示「▶ 在线运行」由 `interactive.js` 的轻量启发式决定（含 `int main`、无 class/vector/string/cin/switch 等）；解释器内部另有完整语法检查，误放行只会得到友好报错，不会产生错误输出。
- 教学原则不变：UB 示例（越界、未初始化、溢出、除零、递归过深）在运行器里会**警告或报错停止**，绝不给出“确定输出”。

## 5. Coding conventions (validator rules + lessons learned)

1. **Escape `<pre><code>` contents**: `<` → `&lt;`, `&` → `&amp;` (`validate.js` enforces this). A bare `>` inline is fine.
2. **HTML fields in data files** (`desc`, `rows` cells, `items[].desc`) are injected raw: write `&lt;string&gt;`, not `<string>` — otherwise the browser swallows it as an unknown tag.
3. **Undefined behavior (UB) is always flagged in red (`.ub-warning`)** and never used as a "predict the output" exam question — a teaching principle of this site.
4. Example "output" is pre-baked; cards already carry the disclaimer. Keep that consistent in new examples — never claim real in-browser compilation.
5. `id`s must be unique per page (example cards, cheat-sheet anchors, catalog cards `toc-chNN`, …).
6. Wrap every `localStorage` access in try/catch; new keys reuse the `cppcourse.` prefix.
7. `file://` compatibility: no ES modules / fetch / workers; new JS keeps the IIFE + `window` global pattern.
8. Keep copy and comments in the existing style; the tone targets first-year students.

## 6. Validation

```bash
node tools/validate.js                              # whole site (HTML + JS + toc consistency)
node tools/validate.js chapters/ch07-classes.html   # single page
```

Checks: local link 404s, `<pre><code>` escaping, unknown-tag whitelist, strict parsing of JSON blocks (quiz-data / ex-steps / mem-data / sort-data), quiz schema, same-page/cross-page anchors, duplicate ids, chapter required sections & scripts, `toc.js` ↔ `chapters/` consistency, and `node --check` on every `assets/js/*.js`.

A non-zero exit code means errors; **keep it at 0 errors, 0 warnings before committing**.

## 7. Manual testing tips

The validator is static only — re-check interactions in a browser after behavioral changes:

- Double-click `index.html` (`file://`), or serve the root directory locally (`python -m http.server` / `npx serve`).
- Key regressions: theme (all three states) and font size survive a reload; home progress checkboxes survive a reload; cheat-sheet quick-jump clears filters, scrolls and flashes while a search filter is active; teacher mode's three switches; `Ctrl+P` print preview.
- Learning progress lives in the browser — clear `localStorage["cppcourse.progress"]` before re-testing it.
