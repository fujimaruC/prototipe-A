<script lang="ts">
	/**
	 * Stack as a 19" rack. CSS 3D, not WebGL: a second GL context would break the one-canvas
	 * rule, and the shared layer's buffer is sized to the hero band. Perspective + transform
	 * gives the same read for a fraction of the cost and degrades to a flat SVG rack.
	 *
	 * Hovering a unit lights it and reveals its tools. The tool lists are always in the DOM as
	 * real text, so nothing is hover-only for keyboard or touch.
	 */
	import { onMount } from 'svelte';
	import { stack } from '$lib/content';
	import { prefersReducedMotion } from '$lib/fx/env';
	import TestMarker from '$lib/components/TestMarker.svelte';

	let stage: HTMLDivElement | undefined = $state();
	let tilt = $state(false);
	let active = $state<number | null>(null);

	onMount(() => {
		if (prefersReducedMotion() || !stage) return;
		if (window.matchMedia('(pointer: coarse)').matches) return;
		tilt = true;

		let raf = 0;
		let tx = 0;
		let ty = 0;
		let cx = 0;
		let cy = 0;

		const onMove = (e: PointerEvent) => {
			if (!stage) return;
			const r = stage.getBoundingClientRect();
			tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
			ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
		};
		const loop = () => {
			cx += (tx - cx) * 0.08;
			cy += (ty - cy) * 0.08;
			if (stage) {
				stage.style.setProperty('--ry', `${cx * 7}deg`);
				stage.style.setProperty('--rx', `${-cy * 5}deg`);
			}
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		window.addEventListener('pointermove', onMove, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('pointermove', onMove);
		};
	});
</script>

<section class="stack" id="stack" data-reveal aria-labelledby="stack-h">
	<header class="head">
		<h2 data-reveal-head data-skew data-platform id="stack-h" class="display">Stack</h2>
		<TestMarker id="TP-04" />
		<p data-reveal-meta class="intro">
			What actually runs the rack. Grouped by where it sits, not by how impressive it sounds.
		</p>
	</header>

	<div class="layout">
		<div class="stage" bind:this={stage} class:tilt>
			<div class="rack" aria-hidden="true" role="presentation">
				<div class="rail top"><span class="mono--micro">19" RACK · U1–U4</span></div>
				{#each stack as group, i (group.title)}
					<div class="unit" class:on={active === i} style:--i={i}>
						<span class="u-face">
							<span class="u-id mono--micro">U{i + 1}</span>
							<span class="u-name">{group.title}</span>
							<span class="u-led" aria-hidden="true"></span>
							<span class="u-vents" aria-hidden="true"></span>
						</span>
					</div>
				{/each}
				<div class="rail bottom"><span class="mono--micro">GROUND · CHASSIS 4U</span></div>
			</div>
		</div>

		<div class="legend">
			{#each stack as group, i (group.title)}
				<div class="entry" class:on={active === i}>
					<button
						class="ehead"
						onmouseenter={() => (active = i)}
						onmouseleave={() => (active = null)}
						onfocus={() => (active = i)}
						onblur={() => (active = null)}
						aria-expanded={active === i}
						aria-controls="unit-{i}"
					>
						<span class="ename">{group.title}</span>
						<span class="enum mono--micro">U{i + 1}</span>
					</button>
					<p class="enote">{group.note}</p>
					<ul id="unit-{i}">
						{#each group.items as item (item)}
							<li class="mono--micro">{item}</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	.stack {
		padding: var(--s-8) 0;
		border-bottom: var(--hair) solid var(--line-strong);
		background: var(--ground);
	}
	.head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
		gap: var(--s-6);
		align-items: end;
		margin-bottom: var(--s-7);
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
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
		gap: clamp(24px, 5vw, 80px);
		align-items: center;
	}
	.stage {
		perspective: 1100px;
		perspective-origin: 50% 40%;
		--ry: 0deg;
		--rx: 0deg;
	}
	.rack {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 8px;
		border: 1px solid var(--line-strong);
		background: var(--ground-sunk);
		transform: rotateX(var(--rx)) rotateY(var(--ry));
		transform-style: preserve-3d;
		transition: transform 120ms linear;
		box-shadow: 14px 14px 0 -1px var(--ground-raised);
	}
	.tilt .rack {
		transition: none;
	}
	.rail {
		display: flex;
		justify-content: space-between;
		padding: 4px 6px;
		color: var(--ink-3);
		border-bottom: 1px solid var(--line);
	}
	.rail.bottom {
		border-bottom: 0;
		border-top: 1px solid var(--line);
	}
	.unit {
		display: block;
		width: 100%;
		text-align: left;
		background: var(--ground);
		border: 1px solid var(--line-strong);
		padding: 0;
		cursor: default;
		transform: translateZ(0);
		transition:
			transform 220ms var(--ease-draw),
			background-color 220ms var(--ease-draw);
	}
	.unit:hover,
	.unit.on {
		transform: translateZ(18px);
		background: var(--ground-raised);
	}
	.u-face {
		display: grid;
		grid-template-columns: 34px minmax(0, 1fr) 10px 44px;
		align-items: center;
		gap: 10px;
		min-height: 52px;
		padding: 0 10px;
	}
	.u-id {
		color: var(--ink-3);
	}
	.u-name {
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.u-led {
		width: 7px;
		height: 7px;
		border: 1px solid var(--line-strong);
		background: transparent;
		transition: background-color 160ms var(--ease-draw);
	}
	.unit.on .u-led,
	.unit:hover .u-led {
		background: var(--accent);
		border-color: var(--accent);
	}
	.u-vents {
		height: 22px;
		background-image: repeating-linear-gradient(
			to bottom,
			var(--line) 0 1px,
			transparent 1px 4px
		);
	}
	/* ---- legend ---- */
	.legend {
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--line-strong);
	}
	.entry {
		padding: var(--s-3) 0;
		border-bottom: 1px solid var(--line);
	}
	.ehead {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		width: 100%;
		min-height: 44px;
		text-align: left;
		background: none;
		border: 0;
		padding: 0;
		cursor: pointer;
	}
	.ehead:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.ename {
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.enum {
		color: var(--ink-2);
	}
	.entry.on .enum {
		color: var(--accent);
	}
	.enote {
		font-size: 0.78rem;
		color: var(--ink-3);
		margin: 2px 0 6px;
	}
	.entry ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.entry li {
		color: var(--ink-2);
		text-transform: none;
		letter-spacing: 0.04em;
		font-size: 0.7rem;
		border: 1px solid var(--line);
		padding: 3px 6px;
	}
	@media (max-width: 1023px) {
		.layout {
			grid-template-columns: 1fr;
			gap: var(--s-6);
		}
	}
	@media (max-width: 860px) {
		.head {
			grid-template-columns: 1fr;
			gap: var(--s-3);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.rack,
		.unit {
			transition: none;
			transform: none;
		}
	}
</style>
