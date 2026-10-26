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
  js/errors-data.js        Error museum data ERRORS_DATA
  js/cheatsheets-data.js   Cheat-sheet data CHEATSHEETS_DATA
  js/pitfalls-data.js      Pitfalls data PITFALLS_DATA
tools/validate.js          Site-wide static validation
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

### 4.4 Styling

- Site-wide variables and the dark theme live in `style.css` under `:root` / `html[data-theme="dark"]`; add colors via CSS variables, never hard-code them.
- Page-specific styles go in that page's `<style>` block (e.g. the cheat-sheet quick-jump row, the home progress bar).
- Print styles: global rules in `style.css` under `@media print`; page-specific print hiding goes in the page's own `<style>`.

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
