# Design notes

## The idea, in one line

The site is a network drawing, not a terminal: Jericho's work presented as a patch schedule you
could audit, drawn on paper with one coloured pen.

## Why the brief changed

The original PRD specified a CTF-platform conceit — boot sequence, `>` prompts, command palette,
lime on grey, pixel fonts, `NEX{...}` flags. Jericho's direction was explicit: *"Avoid any theme
that feels like black green CLI hacker theme"*, and the chosen direction was to drop the hacker
conceit entirely.

That is not a palette swap. The register had to change with it:

| Rejected | Replaced by | Why |
|---|---|---|
| Boot sequence with `>` prompts | Hero resolves from Bayer-dithered noise | Same "system coming online" idea without the shell prompt |
| Command palette (`help`, `whoami`) | Drawing-set index sheet (`/`) | Same keyboard power; a drawing has an index, a terminal has commands |
| CTF scoreboard with points | Test-results sheet | Invented points would be fabricated data |
| `NEX{...}` flags | `CKT{...}` test points | Circuit vocabulary instead of capture-the-flag vocabulary |
| Lime `#B6F23A` | Ochre `#A34817` | Lime on light grey still reads as hacker; ochre reads as a pen |
| Pixel/bitmap display font | Archivo (variable) + Martian Mono | Pixel fonts are retro-terminal; a drawing needs an engineering grotesk |
| Waving pixel flag | Patch cable drawn across the port strip | The cable is the drawing's own subject |
| Black-background invert with lime | Photographic negative: ink ground, paper ink, same ochre | Reads as a negative of the sheet, not a dark mode |

The full mapping, with requirement IDs, is in `docs/design/00-contract.md` §3.

## Creative features beyond the brief

1. **The patch cable.** One ochre run threading all five port plates in the hero, drawn in
   staggered segments on load; hovering a plate thickens its own segment via `:has()` and a
   stroke-width change. It is the signature moment: the drawing's own subject acting as the
   page's ornament. Deliberately confined to the hero — an earlier full-page version crossed the
   record table and read as a rendering bug, which is exactly the kind of "clever" that looks
   broken.
2. **Dither resolve on the hero name.** A 4×4 Bayer ordered-dither canvas that resolves the name
   from noise in 620ms, seeded so it is deterministic, skippable by any key or click, once per
   session, absent under reduced motion.
3. **Registration marks.** Corner crosses on the sheet frame and `+` marks on every panel, in
   the vocabulary of a real engineering drawing rather than decorative chrome.
4. **Live telemetry in the drawing's own idiom.** Time in `Asia/Makassar`, scroll %, uptime,
   viewport — presented as a drawing's title-block data, not a HUD.
5. **Crosshair with lock-on.** Fine-pointer only; the readout names the frame under the cursor
   (`P02`, `CF-03`). Hidden near the chrome strip where it would duplicate the telemetry readout.
6. **Negative mode as a token swap.** A 380ms cross-fade of the ground/ink pair; ochre is
   re-declared as `#E08A5C` (4.9:1 on ink) so contrast survives the inversion.
7. **Spring-driven case-file panels.** Motion (`motion` package) drives height with a spring, so
   a fast second click reverses from the current height instead of snapping. Content rows
   stagger in at 26ms.
8. **Konami → one-shot glitch pass** with a `steps()` inversion, skipped under reduced motion.

## Token system

All in `src/lib/styles/tokens.css`. No component contains a raw hex, duration or easing.

- Ground `#ECECEC`, raised `#E4E2DB`, sunk `#F5F3EE`.
- Ink `#0A0A0A` (16.8:1), `#57544E` (6.4:1), `#6B6862` (4.7:1).
- One accent: ochre `#A34817` (5.1:1 on ground, 6.0:1 with white text on it).
- Radius `0`, hairline `1px`, no shadow anywhere.
- Motion: `--dur-1..5`, three easings (`draw`, `shut`, `cable`), 26ms stagger.

Contrast was measured, not assumed — the numbers above are computed ratios.

## Motion

Verb: **draw**. A plotter moves at a steady speed and settles; it does not bounce in. Springs are
used only where a physical object is the subject (the panel, a cable with slack). See
`docs/design/03-motion.md`.

One clock: `src/lib/fx/driver.ts` owns the only `requestAnimationFrame` loop and the only scroll
measurement; components subscribe. Under `prefers-reduced-motion` the driver never starts, the
dither canvas never mounts, the cable is drawn statically, and Motion is bypassed.

## Dependencies and why

| Package | Reason |
|---|---|
| `@sveltejs/kit` + `svelte` | Locked by the brief. |
| `@sveltejs/adapter-static` | Static output, no server. |
| `motion` | Required by the brief as the primary animation lib; used for the one physics-driven state change (case-file panels). Everything else is CSS transitions on transform/opacity. |
| `@biomejs/biome` | Lint/format, per brief. |
| `playwright`, `axe-core` (dev) | QA only: screenshots, axe, keyboard and tap-target audits. Not shipped. |
| `@types/node` (dev) | Types for `vite.config.ts`. |

Deliberately **not** added: GSAP, Lenis, OGL/Three.js, Tailwind. The brief allows them; nothing
here needs them, and each would cost more than the effect is worth. No WebGL: the one place a
shader would have gone (the hero) is better served by a 2D dither canvas at a fraction of the
cost, and the topology idea is carried by the cable.

## Test point locations

Six tokens, `CKT{...}`, stored only as SHA-256 digests in `src/lib/flags.ts`.

| ID | Where |
|---|---|
| TP-01 | Hidden attribute in the page markup |
| TP-02 | `static/ports.csv` |
| TP-03 | `static/robots.txt` |
| TP-04 | Hidden span in the root layout |
| TP-05 | SVG `<desc>` on the cable drawing |
| TP-06 | The 404 sheet |

Each is base64-encoded so no plaintext token exists in any build output. Verified with
`grep -r "CKT{" build/` → no matches.

## Redesign: Living Plotter Drawing

Rebuilt from the REDESIGN-BRIEF. Identity preserved (sheet, hairline grid, P01-P05 rail, giant
grotesk name, rust accent, both themes, telemetry, crosshair, index, six test points).

### Dependencies added

| Package | Why |
|---|---|
| `gsap` | One clock. GSAP's ticker is now the only rAF loop; the preloader timeline and all scroll choreography run on it. |
| `lenis` | Smooth scroll, driven from the GSAP ticker (`autoRaf: false`) so there is still exactly one loop. |
| `ogl` | The shared WebGL layer. 24 KB gz against Three's ~150, for two fullscreen passes. |

Bundle after P0: **123.9 KB gz initial, 141.3 KB gz total** (budget 180 KB).

### Architecture

- `src/lib/fx/quality.ts` — `high | medium | low` from pointer, width, cores and memory. A
  second-by-second FPS probe downgrades the tier if it averages under 50 for 2 s.
  `?quality=high|medium|low` pins it for visual QA, where software GL would otherwise always
  demote to `low` and hide every effect.
- `src/lib/fx/driver.ts` — rewritten around GSAP's ticker. Lenis is stepped from it, the GL
  layer renders from it, components subscribe with `onFrame()`. Still exactly one loop.
- `src/lib/gl/layer.ts` — the single WebGL canvas, two passes (heat, network). The drawing
  buffer is sized to the **hero band** rather than the viewport, so the layer physically cannot
  paint over another section.
- `src/lib/gl/shaders.ts` — GLSL. The 4×4 Bayer threshold is computed arithmetically: GLSL ES
  1.00 rejects array constructors, which silently failed both shaders at first.

### Creative decisions

1. **Plotter preloader.** Counter 000→100, sheet border drawn with `stroke-dashoffset`, name
   letterspacing collapsing from 0.4em, then a `clip-path` peel. Skippable by key or click,
   once per session. It renders in the prerendered HTML, so the first paint is never blank.
2. **Name physics.** Per-glyph spans, `gsap.quickTo` repulsion within a 190px radius, elastic
   flick on click. Entrance is **transform-only** — the name is the LCP element and must never
   be invisible, including with JS off.
3. **Hero gutter.** The old layout let the "O" touch the intro paragraph. The name column is
   now `1.42fr` against a `minmax(300px, 1fr)` copy column with a `clamp(32px, 5vw, 96px)` gap,
   and the copy sits on its own opaque plate.
4. **Cursor lens.** A thin rust ring with a short pixel trail. An earlier version used a
   `backdrop-filter: invert()` disc; it read as a black blob over the name and was cut.
5. **Portal ring.** Positive/Negative now wipes from the toggle's own centre: a circle expands
   with a rust ring, 520ms, custom cubic-bezier. Reduced motion swaps instantly.

### Cut, and why

**The lava-lamp heat layer is disabled** (`USE_HEAT = false` in `gl/layer.ts`; the shader is
kept and wired). Four tuning rounds — blob count, radius, smooth-min, coverage, gradient shape,
band masking — still produced a uniform ordered-dither lattice over the name and the role line.
A 1-bit dither at that scale has no mid-tones: it either prints a regular lattice or disappears.
Fixing it properly means rendering at half resolution to a `RenderTarget` and upscaling with
`NEAREST`, which is the next thing to try. Per the brief's own priority list, heat resolution is
the first thing to drop, and legibility never drops.

The hero network field remains: nodes, links and travelling packets in the hero band only,
quiet in positive (ink at 50% alpha) and rust in negative.

### Known gaps

- Heat layer disabled, as above.
- Character, portal transitions between sections, Lenis/ScrollTrigger choreography, fullscreen
  case-file sheets, horizontal Record, 3D rack, test-point hunt, sound and Konami: P1–P3.

## Deployment

Live at **https://fujimaruC.github.io/prototipe-A/** via GitHub Actions
(`.github/workflows/deploy.yml`): `pnpm check` → `pnpm build` → fail if any plaintext
test point ships → upload → deploy.

GitHub Pages serves a project repo from `/<repo>/`, which required four changes:

1. `paths.base` from `BASE_PATH` (default `/prototipe-A`), so assets resolve under the subpath.
2. `trailingSlash: 'always'` so `/secret` emits `secret/index.html`.
3. `static/.nojekyll`, otherwise Pages' Jekyll drops `_app/`.
4. `adapter-static` `fallback: '404.html'`, so unknown routes get this drawing's error sheet.

All internal links go through `resolve()` from `$app/paths` — including the all-points redirect,
which originally used a hardcoded `/secret` and broke on the subpath.

## Known limits

- **`/secret` is client-side gating.** It is a static page; the "lock" is a UI state, not
  access control. Anything truly private must not live there. This is stated in the brief's
  spirit (static site, no backend) and is the honest ceiling of a flag gate without a server.
- **Test points are discoverable.** Anyone who reads the source can decode them. That is the
  nature of a client-side puzzle; the point is the moment of noticing, not security.
- **Fonts are two files, latin only.** No subsetting was done beyond Google's latin slice; if
  the site ever needs Indonesian diacritics beyond latin, re-check coverage.
- **No i18n.** Per the brief, v2.
