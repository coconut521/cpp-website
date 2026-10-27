# v2 Chapter Authoring Guide

The canonical component markup is shared with the classic site. Read the full guide at `../../templates/authoring-guide.md` first; it covers example cards, steppers, memory visualization, quizzes, Parsons problems, pointer diagrams, bug hunts, glossary entries and validation rules.

This file only documents the v2-specific additions.

## 1. Copy a Chapter into v2

1. Finish the classic chapter under `chapters/`.
2. Copy it to `v2/chapters/`.
3. Run `node v2/tools/inject-v2.mjs`. The helper adds `v2.css`, `v2-config.js`, `v2-core.js` and `v2-lab.js` and is idempotent.
4. Add `v2-config.js` notes and, optionally, an explainer.
5. Run `node v2/tools/validate-v2.mjs` and `node tools/validate.js`.

## 2. Margin Notes

Add notes under `V2_CONFIG.chapters.chXX.notes` in `v2/assets/js/v2-config.js`:

```js
notes: [
  { section: 1, kicker: "DEFINITION", title: "Short title", body: "One or two sentences." }
]
```

`section` is the zero-based index in the chapter's original `h2` list, including the objectives heading. Notes appear in the right rail; clicking one scrolls to its section. `body` is inserted as HTML, so escape code angle brackets.

## 3. Explainer

Add a `demo` object to the same chapter entry:

```js
demo: {
  cardId: "ch05-ex-04",
  engine: "scene",
  question: "How far does pointer arithmetic move?",
  frames: [ /* one picture per step */ ]
}
```

- `engine`: `memory`, `stack`, `timeline`, `scene`, `grid` or `bars`.
- `question`: the one concrete mechanism question shown at the top.
- `frames`: visual state per step. Line highlight, output and note still come from the example's existing `ex-steps`.
- `useStepStack: true` reuses `step.stack` for `stack`.
- `useStepBars: true` reuses `step.vars["a[]"]`, `step.cmp` and `step.pivot` for `bars`.

Frame shapes:

- `memory`: `{ regions: [{ label, cells: [{ name, type, value, size, addr, state }] }] }`
- `stack`: `{ frames: [{ name, locals: ["x = 1"] }] }`
- `timeline`: `{ events: [{ label, desc, state: "active" | "done" | "next" }] }`
- `scene`: `{ boxes: [{ id, label, sub, cls }], arrows: [{ from, to, label, cls }] }`
- `grid`: `{ rows: [[1,2,3],[4,5,6]], active: [row, col], base: "0x1000" }`
- `bars`: `{ bars: [3,1,4], cmp: [0,1], pivot: 2 }`

The inspector starts paused, supports step/play/pause and prints its final frame. Do not write an explainer that answers more than one question.

## 4. Sync Rules

- v2 is a snapshot; classic content changes do not flow into v2 automatically.
- Keep `assets/js/site-updates-data.js` and `v2/assets/js/site-updates-data.js` identical.
- Shared engine fixes may need to be applied to both the classic and v2 copies.
- Development documentation is English-only.

See `../README.md` for the v2 architecture and `../../DEV.md` for the full development guide.
