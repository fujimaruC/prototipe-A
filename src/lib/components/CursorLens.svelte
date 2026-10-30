<script lang="ts">
	/**
	 * A lens that inverts whatever sits under it — the fastest honest way to show the opposite
	 * theme in a two-tone design. Off on touch and on the low tier.
	 */
	import { onMount } from 'svelte';
	import { app } from '$lib/stores/app.svelte';
	import { isFinePointer, prefersReducedMotion } from '$lib/fx/env';
	import { onFrame } from '$lib/fx/driver';

	let x = $state(-200);
	let y = $state(-200);
	let on = $state(false);
	const trail = Array.from({ length: 8 }, () => ({ x: -200, y: -200, life: 0 }));

	onMount(() => {
		if (!isFinePointer() || prefersReducedMotion() || app.tier === 'low') return;
		on = true;
		let i = 0;
		let acc = 0;
		const stop = onFrame((s) => {
			if (!s.active) return;
			x = s.px;
			y = s.py;
			acc += 1;
			if (acc % 3 === 0) {
				const t = trail[i % trail.length];
				if (t) {
					t.x = s.px;
					t.y = s.py;
					t.life = 1;
				}
				i++;
			}
			for (const t of trail) t.life = Math.max(0, t.life - 0.045);
		});
		return stop;
	});
</script>

{#if on}
	<div class="lens" style:transform="translate3d({x}px, {y}px, 0)" aria-hidden="true">
		<span class="ring"></span>
	</div>
	{#each trail as t, i (i)}
		<span
			class="pix"
			aria-hidden="true"
			style:transform="translate3d({t.x}px, {t.y}px, 0)"
			style:opacity={t.life * 0.55}
		></span>
	{/each}
{/if}

<style>
	.lens {
		position: fixed;
		left: 0;
		top: 0;
		width: 76px;
		height: 76px;
		margin: -38px 0 0 -38px;
		border-radius: 50%;
		background: transparent;
		border: 1px solid var(--accent);
		/* a thin lens: the coordinate tag already carries the readout, so the disc stays light */
		opacity: 0.9;
		pointer-events: none;
		z-index: calc(var(--z-cursor) - 1);
		will-change: transform;
	}
	.ring {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		border: 1px solid var(--accent);
		opacity: 0.55;
	}
	.pix {
		position: fixed;
		left: 0;
		top: 0;
		width: 4px;
		height: 4px;
		margin: -2px 0 0 -2px;
		background: var(--accent);
		pointer-events: none;
		z-index: calc(var(--z-cursor) - 2);
		will-change: transform, opacity;
	}
	@media (prefers-reduced-motion: reduce) {
		.lens,
		.pix {
			display: none;
		}
	}
</style>
