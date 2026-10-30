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

**The lava-lamp heat layer is cut, permanently** (`USE_HEAT = false` in `gl/layer.ts`; the shader
is kept and wired so a future attempt starts from a working harness).

Six rounds: blob count, radius, smooth-min, coverage shape, band mask, and finally a full
rewrite from a signed-distance field to a continuous Gaussian intensity field. Every version
printed a regular 4x4 lattice over the name and the role line.

That is not a tuning miss, it is the medium. 1-bit ordered dithering quantises a smooth field
into a fixed threshold map, so at 3px cells the 12px repeat becomes the dominant visual, and the
human eye reads a grid rather than a mass. Making it read as texture needs error diffusion or a
blue-noise mask, which is a different renderer, not a different constant.

The brief's priority list drops heat resolution first, and legibility never drops. The hero
network field stays: nodes, links and travelling packets, confined to the hero band, quiet in
positive and rust in negative.

### P1: motion system

Personality: **Premium, with one Energetic accent** (the portal ring). One signature easing for
80% of motion, three durations, one entrance pattern: "plotted in", never a bare fade-up.

| Layer | Section reveal |
|---|---|
| Primary | heading wipes in via `clip-path` (not opacity) |
| Secondary | the rule under it draws `scaleX(0 → 1)` |
| Ambient | the meta line settles 60 ms later |

Scroll-velocity skew on display type is capped at 2.5deg and decays within 300 ms, so it reads
as paper flexing. Everything runs on ScrollTrigger, which shares GSAP's ticker with the driver,
so there is still exactly one loop.

Navigation (rail, index, theme toggle) opens a portal ring from the control you pressed. Case
files keep the interruptible spring panel; empty slots are now hatched, stamped REDACTED, with a
scanline sweep, and the sweep is removed under reduced motion.

### Known gaps

- Heat layer cut, as above.
- Case files open as an inline spring panel, not yet a fullscreen FLIP sheet.
- Character, horizontal Record, 3D rack, test-point hunt, sound and Konami: P2–P3.

## P2: character, record journey, rack

### Fujimaru

Variant A of three prototyped on a temporary `/sprite-test` page (deleted after the pick):
balanced posture, crosshair visor, RJ45 tail. Chosen because it stays readable at 24px, where
B's visor band collapsed and C's wire loop turned to noise. Defined in code as a 24-character
string grid (`src/lib/character/sprite.ts`), three frames: idle, blink, walk.

Movement lives in `src/lib/character/engine.ts`. Platforms are elements tagged `data-platform`
(headings, case rows). The engine:

- caches platform top edges and text rects, and **rejects any platform whose top edge has no
  x-position where the sprite covers no text** — that is what enforces "never covers text";
- walks for short hops (<220px) and portals for long ones, both on GSAP so there is still one
  ticker;
- settles only when scroll velocity returns to zero after having been non-zero, which was the
  bug in the first pass (it never re-seated after an instant `scrollIntoView`);
- drags and throws with GSAP `x/y`, never `style.transform` — writing the raw transform fought
  the scale/opacity tweens and snapped the sprite to the origin mid-portal.

Speech bubbles are one line per section, from `bubbles` in `content.ts`. `bubbleFor()` walks up
to the nearest *id'd* section: `closest('section, header')` matched a wrapper with an empty id
and resolved every line to the home copy.

Hidden below 640px, under reduced motion, and on the low tier. `aria-hidden`, `pointer-events`
only on the sprite.

### Record

Pinned horizontal journey: five stops left to right, path drawn across the same span, nodes
popping as the scrub advances. The accessible source of truth stays a real `<table class="sr-only">`;
the journey is `aria-hidden` decoration over it. Under 900px or reduced motion the pin is not
built at all and a horizontal strip renders instead.

Two fixes worth recording: `containerAnimation` never fires for a pinned horizontal tween, so
node pops are keyed to the master timeline's progress instead; and the first node is set visible
before any scrub, because a pinned section must never open on an empty stage.

### Stack

CSS 3D rack rather than WebGL: a second GL context would break the one-canvas rule, and the
shared layer's buffer is sized to the hero band. Perspective plus `translateZ` on hover gives the
same read for no extra bundle, and degrades to a flat rack.

The rack is `aria-hidden` decoration; the legend beside it holds the real controls (`<button>`
with `aria-expanded`/`aria-controls`) and the tool lists are always present as text, so nothing
is hover-only. An earlier version put buttons inside the `aria-hidden` rack, which axe flagged as
`aria-hidden-focus`; dimming inactive legend entries with `opacity` also pushed the unit labels
under 4.5:1. Both removed.

Bundle: **128.5 KB gz initial, 146.3 KB gz total** (budget 180).


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
