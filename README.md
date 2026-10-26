# College C++ Offline Assistant

**Language / 语言**: [English](README.md) | [简体中文](README.zh-CN.md) ｜ Dev Guide / 开发说明: [DEV.md](DEV.md)

A fully offline C++ teaching website built with plain HTML5 + CSS3 + vanilla JavaScript. **No CDN, no network requests, no build step.** Copy the folder to any machine and double-click `index.html` — it works straight from `file://`.

> ⚠️ Program outputs shown on the pages are pre-baked teaching results. For real compilation, use g++ / MSVC + VS Code locally.

---

## 1. Quick Start

1. Copy the whole project folder (including the `chapters/` and `assets/` subfolders) anywhere you like.
2. Double-click `index.html` to open it in a browser (Chrome / Edge / Firefox all work).
3. Done — nothing to install, no internet required.

You can also serve it locally (identical behavior): run `python -m http.server` or `npx serve` in the project root and open the printed address.

## 2. What's Inside

| Page | Content |
| --- | --- |
| `index.html` | Home: global search, special topics, chapter catalog, **learning progress**, recent updates |
| `chapters/ch01…ch12.html` | 12 lecture chapters: variables → operators → control flow → functions → pointers & references → arrays & strings → classes → inheritance & polymorphism → move semantics & smart pointers → templates & STL → exceptions → lambda & modern C++ |
| `errors.html` | Compiler-error museum: 51 common errors with the exact message, cause, fix, and prevention (including frequent Visual Studio 2026 issues) |
| `sorting.html` | Sorting special topic: bubble/selection/insertion/shell/quick/merge/heap — 7 classic sorts with steppers, a complexity/stability table, and a quiz |
| `cheatsheets.html` | Cheat sheets: 19 searchable, copyable, printable reference tables |
| `exam-pitfalls.html` | Exam pitfalls: 20 classic trap topics + random practice + the "Bug Hunt" find-the-bug trainer |

## 3. Features

### Lecture chapters
- **Example code cards**: one-click copy, download as `.cpp`, show the pre-baked output, or run the **step-by-step stepper** (current-line highlight + variable table + console).
- **Interactive widgets**: memory visualization, `i++` / `++i` animation, drag-to-sort, side-by-side comparisons, collapsible answers.
- **Quizzes**: multiple choice, true/false, fill-in, and code fill-in with instant grading and explanations; the self-check list supports per-item "know it / don't know" marking.
- **Bug Hunt (find-the-bug)**: every chapter ends with an auto-inserted "🔥 火眼金睛：本章找错" section — read a snippet hiding one defect, click the offending line, submit, and get instant verdict plus an explanation (compile errors / logic errors / undefined behavior).
- **Glossary tooltips**: 49 terms in the prose (pointers, polymorphism, iterator invalidation, …) get a dashed underline automatically; hovering pops a plain-language explanation, clicking jumps to the covering chapter. Only the first occurrence per term per page is marked.
- **Floating page TOC**: on wide windows a vertical "目录" tab sits at the left edge; open it to jump to any section of the chapter, with the current section highlighted as you scroll. It hides itself on narrow windows, in presentation mode, and when printing.
- **Weak-point list**: click "don't know" on any item in a chapter's learning objectives or self-check list, and the 🎯 button in the top bar collects weak points from all chapters, each linking back to its chapter.
- Previous/next chapter navigation is generated automatically at the bottom of every chapter.

### Cheat sheets (cheatsheets.html)
- The search box filters by sheet title or entry keywords; category chips filter by topic.
- The **quick-jump buttons** under the search box (priority, string, vector, iterator invalidation, …) scroll to the matching sheet and flash-highlight it.
- Every sheet has a copy button; `Ctrl+P` prints to PDF (the filter bar hides automatically).

### Compiler-error museum (errors.html)
- Search by message or keyword, filter by category and compiler (g++ / MSVC / VS 2026), expand or collapse everything at once.
- The "IDE & toolchain" category collects frequent Visual Studio 2026 issues: the C4996 security check, the console window closing instantly, LNK1168 / LNK2005, garbled Chinese output, the C++14 default standard, missing DLLs in Debug builds, PDB notices, and IntelliSense false red squiggles.

### Sorting special topic (sorting.html)
- 7 exam-relevant sorts: bubble/selection/insertion each with a step-by-step stepper (line highlight + variable table); quicksort partition and merge merge are traceable step by step; shell & heap sort are covered conceptually.
- Complexity/stability comparison table, classic exam question patterns, and an 8-question quiz.

### Exam pitfalls (exam-pitfalls.html)
- 20 topics, each with the wrong code, why it's wrong, the correct version, and a typical exam question; "random practice" draws 10 questions from the bank.
- The "🔥 Bug Hunt" trainer: 21 snippets hiding a bug (1–2 per chapter); click the suspicious line to submit, filter by chapter, or shuffle the order.

### Learning progress (home page)
- Each chapter card has a **"completed"** checkbox; the progress bar above the catalog shows "x / 12 chapters" in real time.
- Progress is stored in the browser's `localStorage`, **only on this machine and in this browser** — switching computers/browsers or clearing site data loses it. "Reset" clears everything.

### Global search (home page)
Covers chapters, error entries, cheat-sheet entries, pitfalls, bug-hunt exercises, and glossary terms at once. Results appear as you type and link straight to the content.

### Teacher mode
Turn it on via any of: the 🧑‍🏫 button in the top bar / `?teacher=1` in the URL / `Ctrl+Alt+T`.
Once on: reveal all answers and outputs, expand all folded blocks, export a chapter's examples as `.cpp` files, and generate a new-chapter template.

### Presentation mode
Click the 🖥 button in the top bar (or press `Ctrl+Alt+P`): the page is split into one "slide" per section — navigate with `←` `→` / Space, exit with `Esc`. Entering also tries fullscreen and scales the font up, made for projecting lectures. `?present=1` in the URL enters directly.

### Look & print
- `A－` / `A＋` changes the font size; the theme button cycles through **☀️ light → 🌙 dark → 💻 follow system** — "follow system" tracks the OS dark/light preference in real time (all remembered automatically).
- Printing any page (`Ctrl+P`) hides interactive buttons and expands all outputs and folded blocks — handy for PDF handouts.

## 4. Notes

- Example "run results" are pre-baked for teaching; they are not compiled in the browser. Undefined behavior (UB) is always marked in red and is **never** used as a "predict the output" exam question.
- The site makes zero network requests — safe for offline labs and exam rooms.
- Want to contribute content (new chapters, new sheets, styling)? See [DEV.md](DEV.md).

## Copyright

© 2026 **小椰子 (Xiaoyezi)**. All rights reserved.

This site — including all lecture chapters, cheat sheets, the compiler-error museum, and the exam-pitfall notes — is original teaching work by 小椰子; the same notice appears in every page footer. Commercial use is not permitted without permission.
