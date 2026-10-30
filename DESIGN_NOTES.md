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

## Known limits

- **`/secret` is client-side gating.** It is a static page; the "lock" is a UI state, not
  access control. Anything truly private must not live there. This is stated in the brief's
  spirit (static site, no backend) and is the honest ceiling of a flag gate without a server.
- **Test points are discoverable.** Anyone who reads the source can decode them. That is the
  nature of a client-side puzzle; the point is the moment of noticing, not security.
- **Fonts are two files, latin only.** No subsetting was done beyond Google's latin slice; if
  the site ever needs Indonesian diacritics beyond latin, re-check coverage.
- **No i18n.** Per the brief, v2.
