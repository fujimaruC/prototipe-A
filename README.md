# Jericho Mikael — personal sheet

A single-page site for Jericho Mikael (network engineer, security, all-round IT), built as a
network drawing: hairline grid, registration marks, port schedule, one ochre pen.

SvelteKit 5 (runes) · TypeScript strict · static output · no tracking, no third-party scripts.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # svelte-check, zero warnings
pnpm build        # static output in build/
pnpm preview      # serve build/ on :4173
```

Deploy `build/` to any static host (Cloudflare Pages, GitHub Pages, Vercel, nginx).
There is no server, no database, no environment variables.

### GitHub Pages (live)

Every push to `main` builds and publishes via `.github/workflows/deploy.yml`:

**https://fujimaruC.github.io/prototipe-A/**

Because Pages serves project repos from a subpath, the build uses `BASE_PATH`
(default `/prototipe-A`, set from the repo name in CI). For a user site or custom
domain, build with `BASE_PATH='' pnpm build` and adjust `paths.base` accordingly.

## Edit the content

Every string lives in **`src/lib/content.ts`**. Nothing else needs touching to change copy,
add a project, add a competition result, or publish an email address.

- `identity` — name, role, tagline, location, aliases (N-EX, Fujimaru).
- `about` — bio and skill matrix.
- `caseFiles` — the case-file board. Entries with `placeholder: true` render as "Slot open".
- `record` / `certs` — competition results and certifications.
- `stack` — the four stack groups.
- `contact` — email (`null` hides it and shows an offline note), public links.

### Open items (marked `TODO` in `content.ts`)

1. **Email** — `contact.email` is `null`. Set it and the contact block and `/secret` both
   switch to a mailto link with a copy button.
2. **Case files** — three slots are placeholders. Replace `summary` and `body` with real notes
   and delete `placeholder: true`.
3. **Public socials** — only GitHub is published.
4. **Domain** — `src/routes/+page.svelte` has a canonical URL of `https://example.com/`; replace
   it with the real domain (also in `static/robots.txt` and `static/sitemap.xml`).

## Add or change a test point

Test points are verified client-side with SHA-256, so no plaintext token ever ships.

```bash
# 1. hash the token you want to accept
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('CKT{your_token}')).then(b=>console.log(Buffer.from(b).toString('hex')))"
```

2. Add `{ id: 'TP-07', hash: '<the hash>' }` to `TEST_POINTS` in `src/lib/flags.ts`.
3. Bump `TOTAL_TEST_POINTS` usage: it derives from the array, but the copy in
   `src/lib/content.ts` (`secret.locked.found`, `secret.locked.hint`) says "6" — update it.
4. Place the token somewhere in `static/` or the markup. The six current locations are
   documented in `DESIGN_NOTES.md`.

Then verify the rule that matters:

```bash
pnpm build && grep -r "CKT{" build/   # must print nothing
```

## Structure

```
src/lib/content.ts          all copy, typed
src/lib/flags.ts            SHA-256 test-point hashes
src/lib/styles/tokens.css   every colour, size, duration
src/lib/components/         Hero, Profile, CaseFiles, Record, Stack, Contact, TestPoints,
                            Chrome, SideTabs, JumpIndex, Crosshair, Cable, Telemetry
src/lib/fx/                 dither, frame driver, audio, environment probes
src/lib/stores/app.svelte.ts  mode, found points, index state (guarded storage)
src/routes/                 +page (sheet), /secret (gated), +error (404)
static/                     fonts, robots.txt, ports.csv, sitemap, favicon
```

## Design

Read `DESIGN_NOTES.md` for the concept, the token system, motion spec and the reasoning behind
every deviation from the original PRD. Read `docs/design/` for the contract, brief, system and
motion specs written before any UI code.
