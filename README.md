# College C++ Offline Assistant

**Language**: English | [Chinese (Simplified)](README.zh-CN.md) | [Developer Guide](DEV.md)

A fully offline C++ teaching website built with plain HTML5, CSS3 and vanilla JavaScript. **No CDN, no network requests, no build step.** Copy the folder to any machine and double-click a page - it works straight from `file://`.

The repository ships two front ends:

| Version | Entry | Status |
| --- | --- | --- |
| Classic | `index.html` | Stable, original interface |
| v2 | `v2/index.html` | UI refactor test build: editorial chapter layout, lab inspectors, learning map, special-page metaphors |

Both versions share the same teaching content, quizzes, bug-hunt exercises, cheat sheets, error museum, exam pitfalls, teacher tools and WASM runner. The classic version remains fully usable; v2 is the place where the new interface is being validated.

> Program outputs shown on the pages are pre-baked teaching results. For real compilation, use g++ / MSVC + VS Code locally.

---

## 1. Quick Start

1. Copy the whole project folder, including `chapters/`, `assets/` and `v2/`.
2. Double-click `index.html` for the classic site, or `v2/index.html` for the v2 interface.
3. Done - nothing to install and no internet connection is required.

You can also serve the root folder locally (identical behaviour):

```bash
python -m http.server
# or
npx serve
```

Then open the printed address.

## 2. What's Inside

| Page | Content |
| --- | --- |
| `index.html` | Classic home: global search, special topics, chapter catalog, learning progress, site updates |
| `chapters/ch01...ch12.html` | 12 lecture chapters: variables, operators, control flow, functions, pointers and references, arrays and strings, classes, inheritance and polymorphism, move semantics and smart pointers, templates and STL, exceptions, lambdas and modern C++ |
| `errors.html` | Compiler-error museum: 51 common errors with the exact message, cause, fix and prevention |
| `sorting.html` | Sorting special topic: seven classic sorts, steppers, comparison table and quiz |
| `cheatsheets.html` | 19 searchable, copyable and printable reference sheets |
| `exam-pitfalls.html` | 20 exam-trap topics, random practice and the bug-hunt trainer |
| `v2/index.html` | v2 learning map: continue-learning panel, weak-point entry, four side quests and site updates |
| `v2/chapters/...` | v2 chapter pages: chapter cover, reading column, margin notes / lab rail |
| `v2/errors.html` | v2 specimen wall |
| `v2/cheatsheets.html` | v2 card box |
| `v2/sorting.html` | v2 race track |
| `v2/exam-pitfalls.html` | v2 minefield plus the bug-hunt case board |

## 3. Features

### 3.1 Lecture chapters

- **Example cards**: one-click copy, download as `.cpp`, reveal the expected output, run the step-by-step stepper, or use **Run online** - a teaching-subset C++ interpreter compiled to WebAssembly runs simple examples for real. It also works from `file://`.
- **Interactive widgets**: memory visualization, pointer-arrow diagrams, `i++` / `++i` animation, drag-to-sort, Parsons problems, side-by-side comparisons and collapsible answers.
- **Stepper extras**: auto-play with speed control, a call-stack side panel for recursion, and bar-chart visualization for sorting code.
- **Quizzes**: multiple choice, true/false, fill-in, code fill-in and multi-blank code fill-in, with instant grading and explanations. Self-check lists support per-item "know it / don't know" marking.
- **Bug Hunt**: an auto-inserted find-the-bug section at the end of each chapter. Read a snippet hiding one defect, click the offending line, submit, and get a verdict plus an explanation.
- **Glossary tooltips**: 49 terms are marked automatically on first occurrence; hovering shows a plain-language explanation and clicking jumps to the covering chapter.
- **Navigation**: previous/next chapter links and a floating page table of contents on wide screens.
- **Weak-point list**: mark any objective or self-check item as "don't know" and collect weak points across chapters in the top-bar panel.

### 3.2 v2 interface

- **Learning map home**: a 12-stop route with progress fill, continue-learning panel, progress ring, weak-point entry and site updates.
- **Chapter cover**: oversized chapter number, reading time, listing/step counts, learning objectives and a completion toggle.
- **Reading + margin rail**: the chapter body stays in a readable editorial column; the right rail holds the chapter lab question, margin notes, a section index and quick tools.
- **Listings**: every example becomes a `Listing` with a title bar, copy/download/output/step/run toolbar and a dark output terminal.
- **Explainers**: a synchronized inspector with code line, diagram and accumulated output. Each animation asks one concrete question, starts paused, supports step/play/pause and prints its final frame.
- **Special-page metaphors**: sorting race track, compiler-error specimen wall, cheat-sheet card box, exam-pitfall minefield and bug-hunt case board.
- **Command palette**: `Ctrl+K` searches chapters, errors, cheat sheets, pitfalls, glossary terms and page sections; the top bar also has a course drawer.
- **Themes and layout**: light, dark and follow-system modes; paper/ink palette with purple accents; responsive reading layout down to phone width.

### 3.3 Teaching tools

- **Teacher mode**: enable it from the top-bar button, `?teacher=1` or `Ctrl+Alt+T`. Reveal answers and outputs, expand folded blocks, export a chapter's examples as `.cpp`, generate a chapter template, and build a random exam paper from the cross-chapter question bank.
- **Presentation mode**: split a page into one slide per section; navigate with arrow keys or Space; exit with `Esc`.
- **Printing**: hides interactive controls, expands outputs and folded blocks, and in v2 prints the final frame of every explainer.
- **Learning progress**: chapter completion is stored in `localStorage` under the `cppcourse.` prefix.

### 3.4 Special pages

- **Compiler-error museum**: search by message or keyword, filter by category and compiler, expand/collapse all, and see the failing code, exact message, cause, fix and prevention.
- **Cheat sheets**: filter by title or keyword, use category chips and quick-jump buttons, copy a sheet, or print it to PDF.
- **Sorting topic**: seven exam-relevant sorts, step-by-step traces for bubble/selection/insertion/quicksort/merge, a complexity/stability table, classic question patterns and a quiz.
- **Exam pitfalls**: 20 trap topics, each with wrong code, why it is wrong, the correct version and a typical exam question; random practice draws ten questions from the bank.
- **Bug Hunt trainer**: 21 snippets hiding a compile error, logic error or undefined behaviour; filter by chapter or shuffle the order.

## 4. v2 Design Notes

v2 combines three directions:

- **Editorial textbook (body)**: paper/ink surfaces, thin rules and whitespace, chapter covers, a wide reading column and a margin rail.
- **Code lab (components)**: listings, toolbars, output terminals and explainers that synchronize code, diagram and output.
- **Learning map (home)**: a route with progress rather than a plain progress bar, plus continue-learning and weak-point entries.

Special pages each get one metaphor:

| Page | Metaphor |
| --- | --- |
| Sorting | Race track |
| Compiler errors | Specimen wall |
| Cheat sheets | Card box |
| Exam pitfalls | Minefield |
| Bug hunt | Case board |

Purple remains the brand accent for links, current state and progress. Large surfaces use paper/ink colours; special cards use one base surface with icons, numbers and line patterns instead of multi-colour gradients.

## 5. Explainers in v2

All explainers are data-driven and start paused. Each one displays the question it answers, supports step/previous/next/play/pause and shows accumulated output.

| Chapter | Question | Engine |
| --- | --- | --- |
| 1 | What appears in memory when a variable is defined? | memory |
| 2 | Where exactly do `i++` and `++i` differ? | timeline |
| 3 | Where do `continue` and `break` send control flow? | timeline |
| 4 | How do stack frames grow and unwind during recursion? | stack |
| 5 | How far does pointer arithmetic move, and why is `q - p` 3? | scene |
| 6 | Is a 2D array a table or one contiguous chain? | grid |
| 7 | When are objects constructed and destroyed, and why in reverse order? | timeline |
| 8 | Why does pass-by-value lose polymorphism? | scene |
| 9 | What is the difference between copy and move? | memory |
| 10 | What is the difference between `size` and `capacity`? | memory |
| 11 | How does the stack unwind after `throw`, and when do destructors run? | stack |
| 12 | What is stored in a closure for by-value and by-reference capture? | scene |
| Sorting | Why is the pivot in its final position after one partition? | bars |

## 6. Site Updates

The "Recent updates" section on both home pages is driven by:

- `assets/js/site-updates-data.js`
- `v2/assets/js/site-updates-data.js`

The two files are intentionally identical. Each entry has `date`, `tag`, `title`, `desc`, `href` (classic path) and `hrefV2` (v2 path). Keep both copies in sync when adding an update.

The classic site also shows a dismissible **v2 test build** banner at the top of every page, with a link to `v2/index.html`. The banner is hidden in print and presentation mode.

## 7. Notes

- Most example "run results" are pre-baked for teaching. The **Run online** button executes a teaching-subset interpreter for supported syntax and stops with an explanation on undefined behaviour or unsupported syntax.
- Undefined behaviour (UB) is always marked in red and is **never** used as a "predict the output" exam question.
- The site makes zero network requests. The WASM interpreter ships inside the folder: browsers fetch the separate `.wasm` over HTTP(S), or fall back to the embedded base64 copy on `file://`.
- All development documentation is English-only. The Chinese user guide (`README.zh-CN.md`) is provided for end users and is not a development document.
- For contribution rules and component schemas, see `DEV.md` and `templates/authoring-guide.md`.

## Copyright

© 2026 **Xiaoyezi**. All rights reserved.

This site - including all lecture chapters, cheat sheets, the compiler-error museum and the exam-pitfall notes - is original teaching work by Xiaoyezi; the same notice appears in every page footer. Commercial use is not permitted without permission.
