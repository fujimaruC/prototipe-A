# Motion spec — P1 (applies the motion-design skill)

## Personality

**Premium, with one Energetic accent.** The site is a technical drawing: it should feel
engineered and deliberate, not playful. The single energetic moment is the portal ring, which is
the one place the drawing "opens".

| Constant | Value | Applies to |
|---|---|---|
| Signature easing | `cubic-bezier(0.22, 0.61, 0.36, 1)` (`--ease-draw`) | 80% of motion: reveals, panels, wipes |
| Exit easing | `cubic-bezier(0.55, 0.06, 0.68, 0.19)` (`--ease-shut`) | closing, dismissing |
| Overshoot easing | `cubic-bezier(0.34, 1.26, 0.64, 1)` (`--ease-cable`) | the ring, the cable |
| Quick | 120 ms | hover, press |
| Standard | 380 ms | panel, section reveal |
| Slow | 620 ms | preloader resolve, ring sweep |

Entrance pattern: **plotted in** — clip-path or stroke draw, never a bare fade-up.

## Three layers

Every section reveal carries all three, or it is cut:

| Layer | What it is | Example |
|---|---|---|
| Primary | the heading mask reveal | `clip-path: inset(0 100% 0 0)` → `inset(0)` |
| Secondary | the rule under the heading draws left→right | `scaleX(0)` → `1` |
| Ambient | the section's own index/detail line fades up 40 ms later | opacity + 6px |

## Choreography budget

- Section reveal: 380 ms, stagger 60 ms across heading → rule → detail. Total 500 ms.
- Stagger never exceeds 100 ms per item and never totals over 500 ms.
- Scroll velocity skew: ±2.5deg max on display type, decays to 0 within 300 ms of stopping.

## Rules enforced here

1. Never linear for spatial movement.
2. Never opacity-only for a state change — always pair with transform or clip.
3. No motion travels more than 1/3 of the viewport without an intermediate keyframe.
4. One clock: everything on GSAP's ticker via `onFrame` or ScrollTrigger.
5. Reduced motion: every rule above collapses to the final state, nothing hidden.

## Heat layer (lava lamp)

The earlier attempt failed because `cover` saturated to a constant inside each blob, so the
Bayer threshold printed a regular lattice instead of a dithered mass. Fix: the coverage gradient
must span the *whole* signed-distance range, not just the surface band.

`cover = smoothstep(0.06, -0.55, field) * 0.62`

Deep inside a blob the field is strongly negative → cover near 0.62; at the rim → 0. Continuous
gradient, so the dither resolves into a soft dithered mass with a visible edge falloff.
