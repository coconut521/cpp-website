# College C++ Offline Assistant - v2

**Language**: English | [Chinese (Simplified)](README.zh-CN.md) | [Developer Guide](../DEV.md)

v2 is the UI refactor test build. The original site stays at the repository root; every new file lives under `v2/`. Open `v2/index.html` directly - no server, no build step, no network connection.

## 1. Design Direction

- **Body: editorial textbook.** Paper/ink surfaces, thin rules and whitespace, a chapter cover, a readable centre column and a right margin rail.
- **Components: code lab.** Examples become `Listing` blocks with a title bar, toolbar and output terminal; explanations become synchronized inspectors.
- **Home: learning map.** A 12-stop route with progress fill, continue-learning panel and weak-point entry.
- **Special pages: one metaphor each.**

| Page | Metaphor |
| --- | --- |
| Sorting | Race track |
| Compiler errors | Specimen wall |
| Cheat sheets | Card box |
| Exam pitfalls | Minefield |
| Bug hunt | Case board |

Purple remains the brand accent for links, current state and progress. Large surfaces use paper/ink colours. Special cards share one base surface and are differentiated by numbers, icons and line patterns rather than multi-colour gradients.

## 2. What Changed

| Area | v2 experience |
| --- | --- |
| Home | Learning route, continue learning, progress ring, weak points, side quests, site updates, command palette |
| Chapter | Chapter cover, reading column, margin notes / lab rail, reading progress |
| Code | `LISTING 05.1 / main.cpp / line count` header, copy/download/output/step/run tools, dark output terminal |
| Explainer | Code line, diagram and accumulated output stay in sync; starts paused; step / play / pause; final frame on print |
| Navigation | `Ctrl+K` command palette, course drawer, three-state theme, font size, presentation, teacher mode |
| Special pages | Specimen wall, card box, minefield, race track, case board |

## 3. Explainers

All explainers are data-driven and start at the first frame. Each one displays the concrete question it answers and supports first/previous/next/play/pause/last plus a speed selector.

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

`stack` demos can reuse `ex-steps.stack`; `bars` demos can reuse `ex-steps` arrays and comparison/pivot indices. Every other engine uses `frames` in `v2/assets/js/v2-config.js`.

## 4. Directory

```text
v2/
  index.html                    Learning map home
  errors.html                   Specimen wall
  cheatsheets.html              Card box
  sorting.html                  Race track
  exam-pitfalls.html            Minefield + case board
  chapters/ch01...ch12.html     Chapter pages (same content, v2 shell)
  assets/
    css/v2.css                  Tokens, layout, components, print, dark, responsive
    js/v2-config.js             Icons, margin notes, explainer data
    js/v2-core.js               Cover/rail, listings, special pages, command palette
    js/v2-lab.js                Inspector and six renderers
    js/v2-home.js               Learning map, continue learning, weak points
    js/nav.js                   Header, course drawer, footer, pager
    js/interactive.js           Forked interactive engine with SVG icons
    js/present.js               Presentation mode that skips the rail
    js/page-toc.js              Classic floating TOC disabled on v2 pages
    js/site-updates-data.js     Site update feed (keep in sync with the classic copy)
    js/...                      Reused data, quiz, teacher, mastery, bug hunt, glossary, WASM
  templates/
    chapter-template.html       v2-ready chapter template
    authoring-guide.md          English component authoring guide
  tools/
    inject-v2.mjs               Adds v2 CSS/scripts to copied pages
    validate-v2.mjs             v2 static validator
```

## 5. Adding an Explainer

1. Add a normal `example-card` with `script.ex-steps` in the chapter.
2. In `v2/assets/js/v2-config.js`, add a `demo` to `V2_CONFIG.chapters.chXX`:

```js
demo: {
  cardId: "ch05-ex-04",
  engine: "scene",
  question: "How far does pointer arithmetic move?",
  frames: [ /* one visual state per step */ ]
}
```

3. Engine-specific shortcuts:

- `stack` + `useStepStack: true` reuses `step.stack`.
- `bars` + `useStepBars: true` reuses `step.vars["a[]"]`, `step.cmp` and `step.pivot`.
- Other engines read `frames`.

4. Run `node v2/tools/validate-v2.mjs` and step through the result in a browser.

## 6. Adding a Chapter or Syncing Content

v2 is a snapshot. To add a chapter:

1. Finish the classic chapter first.
2. Copy it to `v2/chapters/`.
3. Run `node v2/tools/inject-v2.mjs`.
4. Add margin notes and an explainer to `v2-config.js` if needed.
5. Run both validators.

Keep these files in sync between the classic site and v2:

- `assets/js/site-updates-data.js` and `v2/assets/js/site-updates-data.js` (site update feed).
- Shared engine fixes when the behaviour is meant for both versions.

The v2 test banner is added by the classic `assets/js/nav.js`; v2 does not display it.

## 7. Constraints

- Pure static, zero dependencies, `file://` double-click; no ES modules, `fetch`, CDN or workers.
- No external fonts, images or animation libraries; icons are inline SVG, diagrams are SVG/HTML/CSS.
- Keep print, presentation, light/dark/follow-system and font scaling working.
- UB demos remain conceptual; never present a deterministic output for undefined behaviour.
- Validation: `node v2/tools/validate-v2.mjs` and `node tools/validate.js` must both end with 0 errors and 0 warnings.
- Development documentation is English-only. This README is the English reference; `README.zh-CN.md` is its Chinese translation. See `../DEV.md` for the full development guide.
