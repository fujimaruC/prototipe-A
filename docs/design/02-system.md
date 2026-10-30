# Design System

## Type

Two families. Both self-hosted, both variable, both latin subset only.

| Role | Family | File | Usage |
|---|---|---|---|
| Display | **Archivo** (wght 100–900, wdth 62–125) | `static/fonts/Archivo-Variable.woff2` (88KB) | Name, section titles, case-file titles. Optical width is used as a design lever: narrow (`wdth 75`) for the name, normal for headings. |
| Data / UI | **Martian Mono** (wght 100–800) | `static/fonts/MartianMono-Variable.woff2` (15KB) | Every label, port id, table cell, telemetry readout, nav tab. It is a *drawn* mono with wide, squarish letterforms — closer to plotter lettering than to a code editor. |

Why not the PRD's pixel font: Silkscreen/Pixelify is the retro-terminal register the owner vetoed.
Why Martian Mono over JetBrains Mono: JetBrains Mono is the default code font of every developer
portfolio; Martian Mono's width and stroke read as drafting lettering.

### Scale (fluid, `clamp`)
| Token | Value | Use |
|---|---|---|
| `--text-name` | `clamp(3.6rem, 15.5vw, 13.5rem)` | The name in the hero. Line-height 0.82, tracking `-0.045em`, `wdth 78`. |
| `--text-display` | `clamp(2.2rem, 5.2vw, 4.2rem)` | Section headings. lh 0.92, tracking `-0.03em`. |
| `--text-title` | `clamp(1.15rem, 2vw, 1.6rem)` | Case-file titles, subheads. lh 1.1. |
| `--text-body` | `1rem` / `1.0625rem` | Prose. lh 1.6. |
| `--text-label` | `0.6875rem` | Mono labels, uppercase, tracking `0.14em`. |
| `--text-micro` | `0.625rem` | Telemetry, port ids, table meta. |

Body measure capped at 62ch. Prose is never set in the mono.

## Colour

Tokens are roles, never raw hex in components.

| Token | Value | Contrast on ground | Role |
|---|---|---|---|
| `--ground` | `#ECECEC` | — | Drawing-sheet paper |
| `--ground-raised` | `#E4E2DB` | — | Inset fields, table header band |
| `--ground-sunk` | `#F5F3EE` | — | Panels that lift off the sheet |
| `--ink` | `#0A0A0A` | **16.8:1** | Primary text, all hairlines |
| `--ink-2` | `#57544E` | **6.4:1** | Secondary prose, table meta |
| `--ink-3` | `#6B6862` | **4.7:1** | Tertiary — only at ≥16px or bold |
| `--line` | `rgba(10,10,10,0.22)` | 3.1:1 | Hairline grid, non-text rules (≥3:1 for UI) |
| `--line-strong` | `#0A0A0A` | 16.8:1 | Plate borders, table rules |
| `--accent` | `#A34817` | **5.1:1** | The single ochre pen: active tab, status, cable, focus ring |
| `--accent-ink` | `#FFFFFF` | 6.0:1 on accent | Text on an accent fill (only used on the 44px status chip) |
| `--alert` | `#8F3F12` | 6.2:1 | Destructive / locked state. Deliberately the *same hue family* as accent, darker — this is a drawing, not a dashboard; no second hue is allowed. |

Negative (invert) mode swaps only ground/ink pairs; accent stays `#A34817` on paper-white and
`#E08A5C` on ink (4.9:1). Both are declared as tokens and re-declared under `[data-mode="negative"]`.

### Contrast audit (measured, not assumed)
`#0A0A0A`/`#ECECEC` 16.76 · `#57544E`/`#ECECEC` 6.39 · `#6B6862`/`#ECECEC` 4.70 ·
`#A34817`/`#ECECEC` 5.08 · `#FFFFFF`/`#A34817` 6.01 · `#E08A5C`/`#0A0A0A` 4.92 ·
`#ECECEC`/`#0A0A0A` 16.76 · `#A34817`/`#0A0A0A` 2.6 (never used for text on ink).

## Space

4pt base. Semantic names.

| Token | Value |
|---|---|
| `--s-1` | 4px |
| `--s-2` | 8px |
| `--s-3` | 12px |
| `--s-4` | 16px |
| `--s-5` | 24px |
| `--s-6` | 32px |
| `--s-7` | 48px |
| `--s-8` | 64px |
| `--s-9` | 96px |
| `--s-10` | 144px |
| `--gutter` | `clamp(16px, 3.2vw, 48px)` |
| `--sheet-max` | `1680px` |

Section rhythm varies on purpose: hero gets `--s-10` below, the record table gets `--s-7`, the
contact block gets `--s-9`. Equal spacing everywhere is the tell this design avoids.

## Layout

- **Desktop (≥1024px):** drawing sheet with a 72px left rail holding the rotated side tabs, a
  1px inner border, and a 12-column grid inside. Registration crosses at the four sheet corners.
- **Tablet (768–1023px):** rail collapses to 56px, side tabs stay rotated, grid becomes 8 columns.
- **Phone (<768px):** no rail. Side tabs become a horizontal, scrollable tab strip pinned under
  the header. Grid is one column, gutters 16px. Tables become labelled stacked rows.
- **Grid break, on purpose:** the hero name overflows the 12-column grid to the right edge and
  is optically cropped by the sheet border — the only element allowed to do this. Everything
  else aligns.

## Shape

One radius rule: **0**. Every border is 1px. No shadow anywhere. Depth is expressed by
`--ground-sunk` / `--ground-raised` fills and by hairline weight, never by blur.

## Motion language

See `03-motion.md`. Summary: the motion verb is **"draw"** — things are plotted into existence
with a plotter's steady speed, never bounced in. Easing is a single custom family.

## Theme-ability

Every colour, size, duration and easing is a token in `src/lib/styles/tokens.css`. Negative mode
is a token swap on `[data-mode]`. A re-theme is a one-file edit.
