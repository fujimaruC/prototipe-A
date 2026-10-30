# Motion Spec

## Principles
Motion here does one of three jobs: **prove a system exists** (the cable trace), **show state**
(open/close, lock/unlock), or **guide the eye** (the dither resolve). Nothing else moves. There
is no decorative wobble, no parallax for its own sake, no fade-up-on-every-section.

Motion verb: **draw** — a plotter moving at constant speed, with a short settle. Not bounce,
not elastic, not spring on entrance (spring only on the cable re-route, where a physical cable
is the subject).

## Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-1` | 120ms | State colour, hover ink shift |
| `--dur-2` | 220ms | Tab switch, chip, focus-adjacent |
| `--dur-3` | 380ms | Panel open, dither wipe step |
| `--dur-4` | 620ms | Hero resolve, cable draw segment |
| `--dur-5` | 900ms | Full-sheet cable draw |
| `--ease-draw` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | Plotter: fast start, long settle. The default for anything entering. |
| `--ease-shut` | `cubic-bezier(0.55, 0.06, 0.68, 0.19)` | Leaving. Exits are always shorter than entrances (≈60%). |
| `--ease-cable` | `cubic-bezier(0.34, 1.26, 0.64, 1)` | The cable only. Slight overshoot — a real cable has slack. |
| `--stagger` | 26ms | Per-glyph / per-row stagger. |

## Choreography

1. **Load (once per session, skippable):** the sheet is already there (hairlines, marks, tables
   in place, no fade). The hero name resolves: 6 passes of Bayer-dithered noise over 620ms,
   then crisp. Skipped by any key/click/scroll; skipped permanently under reduced motion.
2. **Section switch:** Bayer wipe from the current plate to the target plate, 380ms, 4 bands.
   Under reduced motion: instant, with the target plate's heading focused.
3. **Cable trace (signature):** on first paint the ochre cable is drawn top-to-bottom over
   900ms, scrubbed by scroll progress after that (SVG `stroke-dashoffset`, one clock). Pointing
   at a case-file row re-routes the cable's last segment to that row's port with
   `--ease-cable` over 380ms. Reduced motion: the full cable is drawn statically, no scrub, no
   re-route.
4. **Case file open:** the row expands its panel with a `grid-template-rows: 0fr → 1fr` reveal
   on the content (transform/opacity on the inner block), 380ms in / 220ms out, interruptible.
5. **Jump index:** overlay enters 220ms (opacity + 8px translate), list items stagger 26ms.
   Escape closes immediately. Filtering is instant, no animation.
6. **Invert:** a single 380ms cross-fade of the ground/ink tokens, with a 1-frame dither flash.
   No full-screen wipe (that would read as a camera shutter, too theatrical).
7. **Konami:** the cable itself pixel-drops into short vertical segments and falls for 900ms,
   then the sheet redraws. One-shot, does not repeat.
8. **Hover:** primary targets answer in the motion verb — the port plate's cable stub extends
   8px toward the cursor and the label's tracking opens by 0.02em. Colour alone is never the
   hover treatment on a primary target. Utility links may just shift ink.

## Rules
- Animate `transform`, `opacity`, `clip-path`, `stroke-dashoffset` only.
- One clock: a single `requestAnimationFrame` driver in `src/lib/fx/driver.ts` feeds scroll
  progress and pointer to every consumer. No `scroll` listeners, no per-component RAF loops.
- No CSS `transform` on anything the driver writes transforms to.
- `prefers-reduced-motion: reduce` → all of the above collapse to their final static state;
  `driver.ts` never starts; audio never auto-plays.
- Stagger never exceeds 26ms per item, 6 items max (156ms total).
- Nothing blocks input. The loader is skippable and lasts ≤620ms.
