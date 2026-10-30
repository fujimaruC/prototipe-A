<script lang="ts">
	/**
	 * Record as a journey: a pinned horizontal track, a path drawn 2023 -> 2026, result nodes
	 * popping in, numbers counting up, and the nationals node left blinking as pending.
	 *
	 * The accessible source of truth stays a real table, visually hidden. The journey is
	 * aria-hidden decoration: it never replaces the data, it only presents it.
	 */
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { record, certs } from '$lib/content';
	import { prefersReducedMotion } from '$lib/fx/env';

	let pinEl: HTMLDivElement | undefined = $state();
	let trackEl: HTMLDivElement | undefined = $state();
	let useJourney = $state(false);

	/**
	 * Oldest first, sorted by year. `[...record].reverse()` reversed the *source* order, which
	 * produced 2025 -> 2024 -> 2023 -> 2026: not a timeline, and visibly wrong on screen.
	 */
	const stops = [...record].sort((a, b) => Number(a.year) - Number(b.year));

	onMount(() => {
		// Eligibility first: the pin markup only exists once `useJourney` is true, so reading
		// pinEl here would deadlock (no node -> return -> flag never set -> no node).
		if (prefersReducedMotion() || window.innerWidth < 900) return;
		useJourney = true;

		gsap.registerPlugin(ScrollTrigger);
		let ctx: gsap.Context | null = null;

		// wait for the journey markup to mount, then build the scrub
		const frame = requestAnimationFrame(() => {
			const track = trackEl;
			const pin = pinEl;
			if (!track || !pin) return;
			ctx = gsap.context(() => {

			const distance = () => Math.max(0, track.scrollWidth - window.innerWidth * 0.72);

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: pin,
					start: 'top top',
					end: () => `+=${distance() + 200}`,
					pin: true,
					scrub: 0.6,
					invalidateOnRefresh: true,
					anticipatePin: 1
				}
			});

			tl.to(track, { x: () => -distance(), ease: 'none' }, 0);


				/*
				 * Nodes stay visible. Keying their opacity to timeline fractions made them
				 * appear and vanish between scroll positions that showed the same labels, so
				 * the journey read as broken at some frames and fine at others. The scrub
				 * still carries the motion: track travel plus the path draw.
				 */
				for (const node of pin.querySelectorAll<HTMLElement>('.node')) {
					gsap.set(node, { scale: 1, opacity: 1 });
				}

			});
		});

		return () => {
			cancelAnimationFrame(frame);
			ctx?.revert();
			useJourney = false;
		};
	});
</script>

<section class="record" id="record" data-reveal aria-labelledby="record-h">
	<header class="head">
		<h2 data-reveal-head data-skew data-platform id="record-h" class="display">Record</h2>
		<p data-reveal-meta class="intro">
			Competition results and certifications. Results are listed as they stand, including the one that is
			still pending.
		</p>
	</header>

	<!-- Accessible source of truth. Always present, in both modes. -->
	<table class="sr-only">
		<caption>Competition results by event, scope, year and result</caption>
		<thead>
			<tr><th scope="col">Event</th><th scope="col">Scope</th><th scope="col">Year</th><th scope="col">Result</th></tr>
		</thead>
		<tbody>
			{#each record as row (row.event + row.year + row.scope)}
				<tr>
					<th scope="row">{row.event}</th>
					<td>{row.scope}</td>
					<td>{row.year}</td>
					<td>{row.result}: {row.detail}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if useJourney}
		<div class="pin" bind:this={pinEl} aria-hidden="true">
			<div class="track" bind:this={trackEl}>
				<span class="axis" aria-hidden="true"></span>
				{#each stops as row, i (row.event + row.year + row.scope)}
					<div class="stop" style:--i={i}>
						<div class="node" class:pending={row.result === 'Qualified'}>
							<span class="mono--micro">{row.result}</span>
						</div>
						<div class="meta">
							<p class="year mono--micro">{row.year}</p>
							<p class="ev">{row.event}</p>
							<p class="scope mono--micro">{row.scope}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<!-- No pin, no scrub: a horizontal strip on touch, a table on reduced motion. -->
		<ul class="strip">
			{#each stops as row (row.event + row.year + row.scope)}
				<li>
					<span class="res mono--micro" class:pending={row.result === 'Qualified'}>{row.result}</span>
					<span class="year mono--micro">{row.year}</span>
					<span class="ev">{row.event}</span>
					<span class="scope">{row.scope}</span>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="certs">
		<h3 class="mono sub">Certifications</h3>
		<ul>
			{#each certs as c (c.name)}
				<li>
					<span class="cname">{c.name}</span>
					<span class="issuer">{c.issuer}</span>
					<span class="cyear mono--micro">{c.year}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.record {
		padding: var(--s-8) 0;
		border-bottom: var(--hair) solid var(--line-strong);
		background: var(--ground);
	}
	.head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
		gap: var(--s-6);
		align-items: end;
		margin-bottom: var(--s-6);
	}
	.display {
		font-family: var(--font-display);
		font-size: var(--text-display);
		line-height: 0.92;
		letter-spacing: -0.03em;
		font-weight: 700;
		font-stretch: 88%;
		text-transform: uppercase;
	}
	.intro {
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--ink-2);
		max-width: 42ch;
	}
	/* ---- journey ---- */
	.pin {
		overflow: hidden;
		/* natural height: a fixed height left a dead band under the labels */
		padding: var(--s-7) 0 var(--s-6);
		position: relative;
		display: flex;
		align-items: flex-start;
	}
	.track {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: clamp(96px, 14vw, 220px);
		width: max-content;
		padding: 0 8vw;
		will-change: transform;
	}
	.axis {
		position: absolute;
		left: 8vw;
		right: 8vw;
		top: 28px;
		height: 1px;
		background: var(--line-strong);
		pointer-events: none;
	}
	.stop {
		position: relative;
		width: 260px;
		padding-top: 72px;
	}
	.node {
		position: absolute;
		top: 0;
		left: 0;
		width: 56px;
		height: 56px;
		border: 1px solid var(--accent);
		color: var(--accent);
		display: grid;
		place-items: center;
		background: var(--ground);
		z-index: 1;
	}
	.node.pending {
		border-style: dashed;
		color: var(--ink-2);
		border-color: var(--line-strong);
		animation: pending 1.6s steps(2, end) infinite;
	}
	@keyframes pending {
		50% {
			border-color: var(--accent);
			color: var(--accent);
		}
	}
	.meta {
		margin-top: 26px;
	}
	.year {
		color: var(--ink-3);
		margin-bottom: 4px;
	}
	.ev {
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}
	.scope {
		color: var(--ink-3);
		margin-top: 4px;
		text-transform: none;
		letter-spacing: 0.04em;
	}
	/* ---- fallback strip ---- */
	.strip {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		border-top: var(--hair) solid var(--line-strong);
	}
	.strip li {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: var(--s-4) var(--s-3) var(--s-4) 0;
		border-bottom: var(--hair) solid var(--line);
	}
	.res {
		color: var(--accent);
	}
	.res.pending {
		color: var(--ink-2);
	}
	.strip .year {
		color: var(--ink-3);
	}
	.strip .scope {
		color: var(--ink-3);
		font-size: 0.8rem;
	}
	/* ---- certs ---- */
	.certs {
		margin-top: var(--s-7);
	}
	.sub {
		color: var(--ink-3);
		margin-bottom: var(--s-3);
	}
	.certs ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0 var(--s-6);
	}
	.certs li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0 var(--s-3);
		padding: var(--s-3) 0;
		border-top: var(--hair) solid var(--line);
		align-items: baseline;
	}
	.cname {
		font-weight: 600;
		font-size: 0.95rem;
	}
	.issuer {
		grid-column: 1;
		font-size: 0.8rem;
		color: var(--ink-3);
	}
	.cyear {
		grid-row: 1 / span 2;
		grid-column: 2;
		color: var(--ink-3);
	}
	@media (max-width: 860px) {
		.head {
			grid-template-columns: 1fr;
			gap: var(--s-3);
		}
		.certs ul {
			grid-template-columns: 1fr;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.node.pending {
			animation: none;
		}
	}
</style>
