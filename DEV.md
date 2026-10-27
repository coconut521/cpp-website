# DEV.md - Development Guide

This guide covers both front ends in the repository:

- the **classic site** at the repository root;
- the **v2 interface** under `v2/`.

All development documentation in this repository is written in English. The site copy itself is Chinese; `README.zh-CN.md` is the end-user guide and is not a development document.

## 1. Technical Constraints (Read First)

- **Pure static, zero dependencies**: HTML5 + CSS3 + vanilla JavaScript (ES2017+). No framework, no build step, no package manager is required to run the site.
- **Must work over `file://`**: no ES modules, no `fetch()` for local data, no CDN, no web workers. All data lives in `window.XXX` globals in `assets/js/*-data.js`, loaded by ordinary `<script>` tags.
- **Zero network requests**: no external fonts, icons, images or animation libraries. Inline SVG, CSS and Canvas are allowed.
- **UTF-8** for every file. The site copy is Chinese; developer-facing prose and comments added from now on must be English.
- **Validator is a hard gate**: `node tools/validate.js` must end with **0 errors and 0 warnings** before committing. The v2 validator must also pass.

## 2. Repository Layout

```text
index.html                     Classic home
errors.html                    Classic compiler-error museum
sorting.html                   Classic sorting topic
cheatsheets.html               Classic cheat sheets
exam-pitfalls.html             Classic exam pitfalls + bug hunt
chapters/ch01...ch12.html      Classic lecture chapters
templates/
  chapter-template.html        New-chapter template
  authoring-guide.md           Component authoring guide (English)
assets/
  css/style.css                Classic site styles + v2 banner styles
  js/theme-init.js             Theme/font bootstrap; exposes window.SiteTheme
  js/highlight.js              Home-grown C++ syntax highlighting
  js/toc.js                    COURSE_TOC + SPECIAL_PAGES
  js/nav.js                    Classic header/footer/pager + v2 test banner
  js/quiz.js                   Quiz engine
  js/interactive.js            Example cards, stepper, memory viz, sort, Parsons, ptrviz
  js/teacher.js                Teacher mode and exam builder
  js/mastery.js                Know/don't-know marking + weak-point panel
  js/bughunt-data.js           Bug-hunt exercise bank
  js/bug-hunt.js               Bug-hunt widget
  js/present.js                Presentation mode
  js/glossary-data.js          Glossary entries
  js/glossary.js               Glossary tooltips
  js/page-toc.js               Classic floating page TOC
  js/quizbank-data.js          Cross-chapter quiz bank
  js/errors-data.js            Error museum data
  js/cheatsheets-data.js       Cheat-sheet data
  js/pitfalls-data.js          Exam-pitfall data
  js/site-updates-data.js      Site feature/UI update feed
  js/cpp-run.js                Online-run entry (window.CppRun)
  js/cpprun-wasm-embed.js      Base64-embedded WASM fallback (generated)
  wasm/cpprun.wasm             Teaching-subset C++ interpreter
tools/
  validate.js                  Original site validator
  cpprun-src/interpreter.ts    WASM interpreter source
  gen-embed.mjs                Generates the embedded WASM copy
  test-cpprun.mjs              22 direct interpreter tests
v2/
  index.html                   v2 learning-map home
  errors.html                  v2 specimen wall
  cheatsheets.html             v2 card box
  sorting.html                 v2 race track
  exam-pitfalls.html           v2 minefield + case board
  chapters/ch01...ch12.html    v2 chapter pages (same content, v2 shell)
  assets/css/v2.css            v2 design system, layout, print, dark, responsive
  assets/js/v2-config.js       Margin notes, icon set, explainer data
  assets/js/v2-core.js         Chapter cover/rail, listings, special metaphors, command palette
  assets/js/v2-lab.js          Explainer engines and inspector
  assets/js/v2-home.js         Learning map, continue learning, weak points
  assets/js/nav.js             v2 header, course drawer, footer, pager
  assets/js/site-updates-data.js  v2 copy of the site update feed
  assets/js/interactive.js     Forked interactive engine with SVG icons
  assets/js/present.js         Presentation mode with v2 rail skipped
  assets/js/page-toc.js        Classic floating TOC disabled on v2 pages
  templates/chapter-template.html  v2-ready chapter template
  templates/authoring-guide.md     English authoring guide
  tools/inject-v2.mjs          Injects v2 CSS/scripts into copied pages
  tools/validate-v2.mjs        v2 static validator
  README.md                    v2 design and authoring notes
```

The v2 folder is a **snapshot copy** of the original content plus a new presentation layer. Editing original pages does not automatically update v2, and vice versa. See section 6.3 for the sync rules.

## 3. Runtime Architecture

### 3.1 Classic page shell

Every classic page is "HTML skeleton + page-local `<style>` + a small script". Shared behaviour lives in `assets/js/`:

1. `theme-init.js` runs synchronously in `<head>` and applies the stored theme/font size.
2. `nav.js` inserts the top bar, footer and chapter pager. On every classic page it also inserts the dismissible v2 test banner.
3. Page scripts render the content (for special pages) or wire the chapter tools.
4. `teacher.js`, `mastery.js`, `present.js`, `glossary.js` and `page-toc.js` add their own buttons/panels.

### 3.2 v2 page shell

v2 pages reuse the original chapter/special content and load a v2 layer after the classic scripts:

- `v2-config.js` - icon set, chapter margin notes, explainer frames and questions.
- `v2-core.js` - detects the page type and builds:
  - chapter cover + reading/rail layout;
  - listing wrappers (title bar, toolbar, output terminal);
  - special-page metaphor headers/classes;
  - `Ctrl+K` command palette and lazy corpus loading;
  - site-update links and last-visit tracking.
- `v2-lab.js` - mounts an inspector inside the configured example card and drives six renderers: `memory`, `stack`, `timeline`, `scene`, `grid`, `bars`.
- `v2-home.js` - builds the learning map, continue-learning panel, weak-point panel, special quests and recent updates.
- `v2/assets/js/nav.js` - v2 header, course drawer, footer and pager.
- `v2/assets/css/v2.css` - design tokens, three-column chapter layout, listings, inspector, special pages, home, print, dark mode and responsive rules.

`v2/tools/inject-v2.mjs` added the v2 `<link>` and `<script>` tags to every copied page; it is idempotent and can be rerun after adding a chapter.

### 3.3 Page-type detection

`v2-core.js` derives the chapter id from `/chapters/chXX-*.html` and the page type from the filename. `v2-lab.js` does the same and also maps `sorting.html` to the `sorting` demo. The rail is inserted after the chapter cover; the cover spans both columns.

## 4. Key Mechanisms

| Mechanism | Notes |
| --- | --- |
| Syntax highlighting | `highlight.js` scans `pre code.cpp`; copy buttons use `data-raw`; line numbers come from CSS counters and are `user-select: none` |
| Navigation | `nav.js` inserts header/footer/pager; chapter pages get previous/next from `COURSE_TOC`; v2 uses its own `nav.js` |
| Theme | `theme-init.js` stores `light` / `dark` / `auto` in `cppcourse.theme`; `auto` follows the OS and reacts to live changes |
| Font size | `nav.js` changes the root font size; stored in `cppcourse.fontscale` (0.8-1.4) |
| Search | Classic home builds one corpus from the data files with `indexOf`; v2 uses the `Ctrl+K` command palette and lazy-loads missing data files |
| Teacher mode | `body.teacher` plus `?teacher=1` and `Ctrl+Alt+T`; answers are revealed with `body.teacher-show-answers` |
| Learning progress | `localStorage["cppcourse.progress"]` stores completed chapter ids; both home pages render progress |
| Last visit | v2 stores `cppcourse.last` on chapter load and uses it for "continue learning" |
| Knowledge marking | `mastery.js` turns objective/self-check items into know/don't-know chips; stored in `cppcourse.mastery` |
| Bug hunt | `bughunt-data.js` + `bug-hunt.js`; auto-inserts before the quiz on chapter pages; line selection marks hit/miss; shuffle re-reads cards from the DOM |
| Presentation | `present.js` groups `main.container` direct children at `h2` / `.section-head` boundaries; v2 skips `.v2-rail`; `Esc` exits |
| Glossary | `glossary.js` wraps the first occurrence of each term per page; longest-first matching; ASCII aliases use word boundaries |
| Classic page TOC | `page-toc.js` collects `h2` headings and shows a left-edge tab on wide screens; hidden on v2 chapter/special pages |
| Stepper | `interactive.js` supports line highlight, variable table, console, auto-play/speed, call stack (`step.stack`) and bars (`vars["a[]"]`, `cmp`, `pivot`) |
| Parsons | `.widget-parsons` + `script.parsons-data`; two-column pool/target; drag or arrow buttons; first wrong line is reported |
| Multi-blank quiz | `mfill` questions: `code` with `____` holes plus `blanks[]`; validator checks the count |
| Pointer diagram | `.widget-ptrviz` + `script.ptrviz-data`; field name must be `frames`, not `steps`; `"null"` draws a null badge; `freed` draws a dangling red dashed arrow |
| Exam builder | Teacher panel uses `QUIZBANK_DATA`, `PITFALLS_DATA[].quiz` and `BUGHUNT_DATA`; data scripts are injected on demand; print CSS prints only the overlay |
| WASM runner | `cpp-run.js` uses HTTP(S) fetch for the separate `.wasm`, and the embedded base64 copy on `file://`; UB stops with a warning/error, never a deterministic output |
| v2 chapter cover | Built from the original `h1`, header paragraph and objectives section; completion button writes `cppcourse.progress` |
| v2 rail | Sticky on wide screens, two-column on tablet, hidden on phones; contains the lab question, margin notes, section index and tools |
| v2 listings | `v2-core.js` wraps each `pre.ex-code` with a header, toolbar and terminal; `interactive.js` inserts the stepper/run box after the listing, not inside it |
| v2 explainers | `v2-lab.js` clones the highlighted code and drives frames from `V2_CONFIG`; default frame is the first step; print moves to the last step |
| v2 special pages | Specimen wall, card box, minefield, case board and race track are added by `v2-core.js` using existing data renderers |
| Site updates | `site-updates-data.js` powers the "Recent updates" list on both homes; keep the classic and v2 copies identical |
| v2 test banner | Classic `nav.js` inserts a dismissible banner; stored in `cppcourse.v2banner`; hidden in print/presentation |

## 5. v2 Configuration and Explainer Authoring

`v2/assets/js/v2-config.js` exposes:

```js
window.V2_CONFIG = {
  chapters: {
    ch05: {
      label: "Pointers and references",
      notes: [
        { section: 1, kicker: "DEFINITION", title: "...", body: "..." }
      ],
      demo: {
        cardId: "ch05-ex-04",
        engine: "scene",
        question: "How far does pointer arithmetic move?",
        frames: [ /* one visual state per step */ ]
      }
    }
  }
};
```

### 5.1 `notes`

- `section` is the zero-based index in the chapter's original `h2` list (including the objectives heading).
- Notes are rendered in the right rail. Clicking a note scrolls to its section.
- `body` is inserted as HTML; keep it short and escape code angle brackets.

### 5.2 `demo`

- `cardId`: the example card that owns the inspector.
- `engine`: `memory` | `stack` | `timeline` | `scene` | `grid` | `bars`.
- `question`: the concrete mechanism question shown at the top. Every explainer must answer one question.
- `frames`: visual state per step. The inspector uses the existing `ex-steps` for line/output/note; `frames` only describe the picture.
- `useStepStack: true` reuses `step.stack` for the `stack` engine.
- `useStepBars: true` reuses `step.vars["a[]"]`, `step.cmp` and `step.pivot` for the `bars` engine.
- If `frames` is shorter than the step list, the last frame is reused.

### 5.3 Frame shapes

- `memory`: `{ regions: [{ label, cells: [{ name, type, value, size, addr, state }] }] }`
- `stack`: `{ frames: [{ name, locals: ["x = 1"] }] }`
- `timeline`: `{ events: [{ label, desc, state: "active" | "done" | "next" }] }`
- `scene`: `{ boxes: [{ id, label, sub, cls }], arrows: [{ from, to, label, cls }] }`
- `grid`: `{ rows: [[1,2,3],[4,5,6]], active: [row, col], base: "0x1000" }`
- `bars`: `{ bars: [3,1,4], cmp: [0,1], pivot: 2 }`

### 5.4 Explainer behaviour

- Starts at the first frame; never auto-plays on load.
- Buttons: first, previous, next, auto/pause, speed select, last.
- Output is accumulated from `step.out` up to the current step.
- Printing triggers `beforeprint`, moves to the last frame and hides the controls; `afterprint` restores the previous step.
- `prefers-reduced-motion` disables auto-play and CSS transitions.

## 6. Common Tasks

### 6.1 Add a chapter (classic)

1. Copy `templates/chapter-template.html` to `chapters/chNN-short-name.html`.
2. Fill in the sections and components. The validator requires three literal section labels and one `<section class="quiz">`; keep the labels exactly as they appear in the template (do not translate or rename them).
3. Append an entry to `COURSE_TOC` in `assets/js/toc.js`.
4. Run `node tools/validate.js`.

Chapter pages also need the seven classic scripts and `theme-init.js` in `<head>`. The validator checks all of this.

### 6.2 Add a chapter to v2

1. Copy the finished classic chapter to `v2/chapters/`.
2. Run `node v2/tools/inject-v2.mjs` to add the v2 CSS/scripts.
3. Add margin notes and an explainer to `v2/assets/js/v2-config.js`.
4. Run `node v2/tools/validate-v2.mjs` and `node tools/validate.js`.

### 6.3 Sync rules

- `v2/` is a snapshot. Content changes in the root do not flow into v2 automatically.
- `assets/js/site-updates-data.js` and `v2/assets/js/site-updates-data.js` must stay identical.
- The v2 test banner lives in the classic `assets/js/nav.js`; v2 does not show it.
- Shared engine fixes (quiz, bug hunt, glossary, WASM) usually need to be applied to both the classic and v2 copies.
- v2-only UI changes belong in `v2/assets/css/v2.css` or `v2/assets/js/v2-*.js`.

### 6.4 Add a cheat sheet / error / pitfall / bug-hunt item / glossary term

- Cheat sheet: append to `assets/js/cheatsheets-data.js` (and the v2 copy if v2 should show it).
- Error: append to `assets/js/errors-data.js`.
- Pitfall: append to `assets/js/pitfalls-data.js`.
- Bug hunt: append to `assets/js/bughunt-data.js` with `id`, `ch`, `title`, `kind` (`compile` / `logic` / `ub`), `code` (one string per line), `bugLine`, optional `hint`, and `why` (raw HTML).
- Glossary: append to `assets/js/glossary-data.js` with `term`, optional `aliases`, `detail` (raw HTML) and optional `href`.
- Keep the data id unique; the home search and v2 command palette pick up new entries automatically.

### 6.5 Update the site update feed

Edit both copies of `site-updates-data.js`. Each item uses:

```js
{
  date: "2026-10-27",
  tag: "UI",
  title: "Short title",
  desc: "One-line summary.",
  href: "v2/index.html",
  hrefV2: "index.html"
}
```

The classic home uses `href`; v2 uses `hrefV2`. Both homes show the first six entries.

### 6.6 Styling

- Classic variables and dark theme live in `assets/css/style.css`.
- v2 tokens, layout and components live in `v2/assets/css/v2.css`.
- Page-specific styles stay in that page's `<style>` block.
- Print rules are in both stylesheets; v2 explainers and listings have dedicated print rules.
- Use CSS variables; do not hard-code colours.

### 6.7 Teacher exam builder and WASM runner

- Exam sources: `QUIZBANK_DATA`, `PITFALLS_DATA[].quiz` and `BUGHUNT_DATA`. All support optional `difficulty`.
- Data scripts are injected on demand, so the builder works on any page, including `file://`.
- The exam overlay prints alone via `body.exam-open`.
- WASM source: `tools/cpprun-src/interpreter.ts`. After changing it, run `npm run build:cpprun` (regenerates both the `.wasm` and the embedded base64 copy) and `npm run test:cpprun` (22 cases). Both output files must be regenerated together.

## 7. Coding Conventions

1. Escape `<`, `>` and `&` inside `<pre><code>`; the validator enforces this.
2. HTML fields in data files (`desc`, table cells, `items[].desc`) are inserted raw: write entities for angle brackets.
3. UB is always marked with `.ub-warning` and must never be a "predict the output" question.
4. Example output is pre-baked unless the card is actually run through the WASM subset. Do not claim real in-browser compilation for pre-baked results.
5. Keep ids unique per page.
6. Wrap every `localStorage` access in `try/catch`; new keys use the `cppcourse.` prefix.
7. `file://` compatibility: no ES modules, no local `fetch()`, no workers; keep the IIFE + `window` global pattern.
8. Keep comments and developer-facing prose in English. The site copy remains Chinese.
9. Do not add external resources or animation libraries.
10. When adding a v2-only component, update `v2.css` and the relevant `v2-*.js`; do not edit the classic copies unless the behaviour is shared.

## 8. Validation

```bash
node tools/validate.js                    # classic site, plus v2 HTML
node tools/validate.js chapters/ch07-classes.html
node v2/tools/validate-v2.mjs             # v2 links, ids, JSON, scripts, JS syntax
```

`tools/validate.js` checks: local link 404s, escaped code blocks, unknown tags, strict JSON blocks, quiz schema, same-page/cross-page anchors, duplicate ids, required chapter sections/scripts, `toc.js` consistency, and `node --check` for `assets/js/*.js`.

`v2/tools/validate-v2.mjs` additionally checks the v2 chapter scripts, v2 JSON blocks, and all `v2/assets/js/*.js`.

A non-zero exit code means errors. Keep both validators at **0 errors, 0 warnings** before committing.

## 9. Manual Testing

The validators are static only. Re-check interactions in a browser after behavioural changes:

- Open `index.html` and `v2/index.html` from `file://`; no console errors.
- Classic: theme (all three states), font size persistence, home progress, v2 banner close, cheat-sheet quick jump, teacher mode, print preview.
- v2: learning map, continue learning after visiting a chapter, command palette `Ctrl+K`, course drawer, chapter cover completion toggle, listing toolbar, explainer step/play/pause, print final frame, special-page filters.
- Presentation mode: `?present=1`, arrow keys, `Esc`; v2 rail must stay hidden.
- Mobile widths: 390 px, 768 px, 1024 px; no horizontal page scroll (internal code/table scrolling is fine).
- `prefers-reduced-motion`: explainer auto-play disabled, transitions reduced.
- Clear `localStorage["cppcourse.progress"]`, `cppcourse.mastery`, `cppcourse.last` and `cppcourse.v2banner` when re-testing those flows.

## 10. Documentation Language Policy

- All development documentation (`DEV.md`, `v2/README.md`, `templates/authoring-guide.md`, `v2/templates/authoring-guide.md`) is English-only.
- The site copy is Chinese; the component templates and required section labels stay Chinese.
- `README.zh-CN.md` is the Chinese end-user guide and is the only intentionally Chinese document.
- New developer-facing comments, commit messages and documentation should be in English.
