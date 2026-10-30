# Requirements Contract

Source: `PRD-sveltekit.md` (v2) **as amended by the owner on 2026-10-30**:

> "The Targeted Profile was Jericho Mikael - Network Engineer, Cybersecurity, and All Rounder IT
> Enthusiast. Avoid any theme that feels like black green cli hacker theme."
> Direction chosen: **drop the hacker conceit entirely** — editorial, diagram-led.
> Identity: **Jericho Mikael** primary, with aliases N-EX / Fujimaru present somewhere.

Where the amendment and the PRD conflict, the amendment wins. Every such conflict is recorded
in §3 with the replacement requirement, so nothing is dropped silently.

## 1. Requirements

### Stack & build
| # | Requirement | Level |
|---|---|---|
| R1 | SvelteKit 5 (runes) + TypeScript `strict` + pnpm | MUST |
| R2 | Static output via `@sveltejs/adapter-static`, all routes prerendered | MUST |
| R3 | All copy lives in `src/lib/content.ts`, typed; editing it alone changes every string | MUST |
| R4 | `pnpm check` and `pnpm build` pass | MUST |
| R5 | Biome for lint/format | SHOULD |

### Visual identity (Section 2 guardrail, accent re-chosen)
| # | Requirement | Level |
|---|---|---|
| R6 | Ground `#ECECEC`, ink `#0A0A0A`, exactly one accent (ochre `#A34817`) | MUST |
| R7 | Zero border-radius, zero box-shadow, 1px hairline borders only | MUST |
| R8 | Display face + mono data face, self-hosted woff2, `font-display: swap`, no CLS | MUST |
| R9 | Section titles rotated 90° as vertical side tabs on desktop | MUST |
| R10 | Hairline panel grid (blueprint/drawing sheet), registration marks (`+`, corner brackets) | MUST |
| R11 | 1-bit dither/halftone imagery only — no gradients, no photography | MUST |
| R12 | Telemetry chrome: local time `Asia/Makassar`, cursor X/Y, scroll %, uptime, viewport | MUST |
| R13 | Crosshair cursor with lock-on on hoverable frames; disabled on touch/AT | MUST |

### Structure (single page + one gated route)
| # | Requirement | Level |
|---|---|---|
| R14 | Sections in order: Hero, Profile, Case files, Record, Stack, Contact | MUST |
| R15 | Vertical side-tab nav; horizontal tab strip on mobile | MUST |
| R16 | `/secret` route, gated by test points | MUST |
| R17 | Designed 404 | SHOULD |

### Features (Section 3, re-cast)
| # | Requirement | Level |
|---|---|---|
| R18 | Hero resolves from dither noise into crisp type; skippable; once per session | MUST |
| R19 | Bayer-dither wipe between section states | MUST |
| R20 | Case file board: category, points, status, expandable write-up panel | MUST |
| R21 | Record table (place / event / year / result) | MUST |
| R22 | ≥5 hidden test points; SHA-256 only in bundle; `/secret` unlocks when all found | MUST |
| R23 | Jump index overlay on `/` or `~`; every section reachable from it | MUST |
| R24 | Negative (invert) mode with no contrast regressions | MUST |
| R25 | Konami easter egg | MUST |
| R26 | Opt-in UI ticks (Web Audio), muted by default | NICE |

### Quality floors
| # | Requirement | Level |
|---|---|---|
| R27 | Every section reachable by keyboard; visible focus ring (≥3:1) | MUST |
| R28 | WCAG AA: all text ≥4.5:1 in both modes | MUST |
| R29 | `prefers-reduced-motion`: no boot, no wipe, no parallax, no trace draw, no rain — static final state, fully usable | MUST |
| R30 | Lighthouse perf ≥90 mobile; initial JS <180KB gz; heavy effects lazy | MUST |
| R31 | No tracking, no analytics, no third-party scripts | MUST |
| R32 | No plaintext test-point token in build output | MUST |
| R33 | No phone number, address, or precise location | MUST |
| R34 | Layout verified at 360 / 768 / 1280 / 1920 | MUST |
| R35 | Touch targets ≥44px; no horizontal scroll | MUST |

## 2. Component states

| Component | States to build |
|---|---|
| Nav tab | default · hover · focus-visible · active/current · disabled (n/a) |
| Case file row | collapsed · hover · focus-visible · expanded · placeholder/draft |
| Expand panel | closed · opening · open · closing (interruptible) |
| Jump index | closed · open · filtering · empty result · keyboard-selected |
| Invert toggle | light · dark · focus-visible · pressed |
| Test point input | empty · typing · invalid · valid · already-found · disabled |
| Copy email button | idle · copied · unavailable (TODO) |
| Telemetry readout | live · static (reduced motion) |
| Reduced-motion root | on / off |
| /secret | locked · unlocked · partial progress |

## 3. Deviations from PRD (recorded, not silent)

| PRD item | Status | Replacement |
|---|---|---|
| Boot sequence (§3.1) | REJECTED | Terminal boot copy is the exact "CLI hacker" read the owner vetoed. Replaced by R18: a dither resolve of the hero title, no `>` prompt, no auth lines. |
| Command palette (§3.9) | REPLACED | R23 jump index: a drawing-set index sheet (`/` or `~`). Same keyboard power, no terminal styling, no `help`/`whoami` commands. |
| CTF scoreboard + points (§3.7) | RECAST | R21 Record: a test-results sheet. Real achievements only. |
| Challenge board w/ points (§3.6) | RECAST | R20 Case files: a cable schedule (records, categories, status). Points dropped — invented scores are fabrication. |
| `NEX{...}` flags (§3.8) | RECAST | R22 test points `CKT{...}` — network-drawing vocabulary, hash-only. |
| Lime `#B6F23A` (§2) | CHANGED | Ochre `#A34817`. Lime-on-grey is the hacker palette by another name. |
| Pixel/bitmap display font (§2) | CHANGED | Archivo (variable, wide/narrow) + Martian Mono. Pixel fonts read as "retro terminal"; the drawing-sheet read needs an engineering grotesk. |
| Waving pixel flag (§3.5) | DROPPED | Replaced by the patch-cable trace (R19b, see 03-motion.md). |
| Invert = black bg / lime accent (§3.10) | CHANGED | R24 negative mode: ink ground, paper-white ink, same ochre. Reads as a photographic negative of the drawing. |
| 3D/WebGL hero (§3b) | NOT BUILT | No GL. The topology diagram (SVG) carries the "system" idea at 0 KB of shader cost. Documented in DESIGN_NOTES. |
| Audio (§3b) | BUILT, opt-in | R26. Muted by default, toggle in chrome, no autoplay. |
| i18n | OUT OF SCOPE | Per PRD §7. |

## 4. Unknowns requiring the owner

- U1 Domain name and deploy target (Cloudflare Pages / GitHub Pages / Vercel).
- U2 Public contact methods — email address, socials.
- U3 LKS Nasional XXXIV 2026 result — currently "qualified", not a placement.
- U4 Real write-ups for the 3 placeholder case files.
- U5 Whether `github.com/fujimaruC` is the canonical GitHub.
