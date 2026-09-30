# Entangled

[中文](README.zh-CN.md)

Two browser windows, two particle orbs, one tether. Each window is a camera into a shared world; the same iteration links an Ethereum view to a Tezos view.

A local viewer. The artwork is Bjørn Staal's *Entangled* (fxhash VERTEX, 2024), recovered from the on-chain filesystem via [fire17/entangled-grail](https://github.com/fire17/entangled-grail). `src/bundle.min.js` and `src/fxhash.min.js` are unchanged. This repo changes the control panel and how the page is served. Rights are in [NOTICE.md](NOTICE.md).

## Run

Use two real browser windows. Tabs and an editor preview share one screen origin, so the tether will not line up.

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:8082`). Click the corner button to expand the panel. The icon at the end of the chain row opens the other chain at the same iteration.

## How it connects

The windows share their rectangles through same-origin `localStorage`. Each window is a camera into one screen-coordinate world.

The tether appears when the iteration matches and the chains differ: one Ethereum, one Tezos. Two windows on the same chain are two lenses on one simulation. Different iterations stay separate.

One iteration is one style. The seed is `1024 * (iteration + 1) + 7`. It draws the palette, motion, connection, and core geometry. Tezos URL numbers 2–256 are shuffled. The panel's iteration is the style id before that shuffle, and both windows share it.

## What changed

The `v0-live` cycler in [fire17/entangled-grail](https://github.com/fire17/entangled-grail) is replaced by the panel below.

**Floating button.** It starts as a 36px button at opacity 0.28, and rises to 0.92 on hover. Drag it. The open panel drags too. Closing leaves the button where it was. In the right or bottom half of the screen, the panel grows up and to the left from that button.

**Four fields.**

| Field | What it does |
|---|---|
| Chain | Ethereum / Tezos, this window only. The icon opens the other chain at the same iteration. |
| Colors | Three swatches affect this window. Random repaints both. Restore returns each window to its own chain's palette for the current iteration. |
| Iteration | 1–256, shared by both windows. Arrow keys do the same. Changing it drops the temporary colors. |
| Quality | A 20–100 slider. Releasing it reloads both windows. Particle count is 1.5 million times this ratio. Below 100% turns off antialiasing and the 2× internal resolution. |

`[` and `]` paint the neighboring iteration's palette onto this window. The iteration stays, and the other window stays.

**URL.** `fxiteration` and `fxchain` stay. `quality` is omitted at 100%. `noshuffle` is kept only when an old link already has `noshuffle=1`. The panel has no fixed / shuffle switch.

**Window list.** When `index.html` writes the `windows` key, it merges. Saving one window keeps the other window's live record. A record is removed when that window marks itself closing.

**Serving.** Vite sends `index.html` and the scripts in `src/` as the original files. The artwork is a classic script and expects the global `THREE` and `$fx`.
