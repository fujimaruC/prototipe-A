# DISCOVERY — prototipe-A before the rebuild

**Stack.** SvelteKit 5 (runes) + TS strict, `adapter-static` with `fallback: '404.html'`, base
`/prototipe-A` (GitHub Pages). Deploy: `.github/workflows/deploy.yml` -> `build/`.
**Bundle now:** 76.2 KB gz JS, 7.6 KB gz CSS, 2 woff2 (103 KB). Largest chunk 30.9 KB.

**Routes.** `/` (`+page.svelte`) composes Hero, Profile, CaseFiles, Record, Stack, Contact,
TestPoints. `/secret` flag-gated. `+error.svelte` = 404 sheet.

**Components (`src/lib/components/`).**
`Hero` canvas dither-resolve (620ms, `paintDither`) · `Cable` SVG segments in hero ·
`Profile` matrix table · `CaseFiles` rows + Motion spring panels · `Record` table + certs ·
`Stack` 4-up grid · `Contact` · `TestPoints` SHA-256 form · `Chrome` top bar (mode/sound/index
buttons + `Telemetry`) · `Telemetry` 1s interval + pointermove · `SideTabs` rotated rail, also
the mobile strip · `JumpIndex` dialog on `/` or `~` · `Crosshair` fixed lines + readout.

**Theme.** `app.mode` in `src/lib/stores/app.svelte.ts`; persisted `sessionStorage['nex.mode']`
(guarded try/catch). Applied as `document.documentElement.dataset.mode` in a `$effect` in
`+layout.svelte`. Tokens re-declared under `[data-mode='negative']` in `tokens.css`.

**Store.** `app` = `{ mode, found, introSeen, sound, indexOpen, ready }` + `hydrate()`,
`setMode()`, `toggleMode()`, `markSeen()`, `addFound()`, `allFound()`. Nothing else holds state.

**Clock.** `src/lib/fx/driver.ts` — one rAF loop, `onFrame(fn)` subscribers, writes
`{scroll, y, px, py, active}`. Started only when motion is allowed. Section tracking in
`+page.svelte` reads it. **This is the loop to extend, not duplicate.**

**Crosshair.** Fine-pointer only, two fixed 1px lines + coordinate tag, hides the tag under the
chrome strip (`y < 96`). `pointermove` listener, no rAF.

**Palette.** `tokens.css`: `--ground #ECECEC`, `--ground-raised`, `--ground-sunk`, `--ink
#0A0A0A`, `--ink-2/-3`, `--line`, `--line-strong`, `--accent #A34817` (negative `#E08A5C`),
`--accent-soft`, `--alert`. Type: `--font-display` Archivo, `--font-mono` Martian Mono;
`--text-name/display/title/body/label/micro`. Space `--s-1..10`, `--gutter`, `--rail`,
`--sheet-max`. Motion `--dur-1..5`, `--ease-draw/shut/cable`, `--stagger`. Layers
`--z-sheet/tabs/chrome/cursor/overlay`.

**Motion already present.** CSS transitions on transform/opacity; Motion springs on case-file
panels; dither canvas on hero; cable `stroke-dashoffset`; Konami glitch class. No GSAP, no
Lenis, no WebGL yet — all three now installed but unused.

**Gaps the brief targets.** No preloader; hero name static (no physics); no GL layer; no heat
layer; no portal character; no portal/ring transitions; no Lenis/ScrollTrigger; case files
expand inline only; Record is a plain table; Stack is a static grid; no cursor lens; hero "O"
crowds the intro paragraph; dead space under the name; quality tiering absent.
