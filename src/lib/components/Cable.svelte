<script lang="ts">
/**
 * Signature: the patch cable. One ochre run threading every port plate in the hero strip,
 * drawn once on load in staggered segments. Hovering a plate thickens its own segment.
 * Decorative — the same information is in the port labels — so it is aria-hidden and it
 * never leaves the hero, which is why it can never cross body copy.
 */
import { onMount } from 'svelte';
import { prefersReducedMotion } from '$lib/fx/env';

let drawn = $state(false);
const SEGMENTS = 5;

// One run, chamfered down and back at every port, the way a cable is dressed in a drawing.
const x0 = 4;
const x1 = 996;
const step = 1000 / SEGMENTS;
const sag = 30;
const yTop = 10;

const segments = Array.from({ length: SEGMENTS }, (_, i) => {
	const cx = step * i + step / 2;
	const left = cx - step * 0.2;
	const right = cx + step * 0.2;
	const start = i === 0 ? x0 : left;
	return {
		id: String(i + 1),
		d: `M ${start} ${yTop} L ${left} ${yTop} L ${left + 10} ${sag} L ${right - 10} ${sag} L ${right} ${yTop} L ${i === SEGMENTS - 1 ? x1 : right} ${yTop}`,
	};
});

onMount(() => {
	if (prefersReducedMotion()) {
		drawn = true;
		return;
	}
	const id = window.setTimeout(() => (drawn = true), 120);
	return () => window.clearTimeout(id);
});
</script>

<div class="cable" aria-hidden="true">
	<svg viewBox="0 0 1000 40" preserveAspectRatio="none" role="presentation">
		{#each segments as seg, i (seg.id)}
			<path
				class="seg"
				class:on={drawn}
				data-port={seg.id}
				d={seg.d}
				fill="none"
				stroke="var(--accent)"
				stroke-width="1"
				vector-effect="non-scaling-stroke"
				stroke-linecap="square"
				style:--i={i}
			/>
		{/each}
	</svg>
</div>

<style>
	.cable {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		height: 40px;
		pointer-events: none;
	}
	svg {
		width: 100%;
		height: 100%;
		display: block;
		overflow: visible;
	}
	.seg {
		stroke-dasharray: 320;
		stroke-dashoffset: 320;
		opacity: 0.55;
		transition: stroke-dashoffset var(--dur-5) var(--ease-draw) calc(var(--i) * 90ms);
	}
	.seg.on {
		stroke-dashoffset: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.seg {
			transition: none;
			stroke-dashoffset: 0;
		}
	}
</style>
