<script lang="ts">
import { onMount } from 'svelte';
import { isFinePointer, prefersReducedMotion } from '$lib/fx/env';

let h = $state(false);
let v = $state(false);
let x = $state(0);
let y = $state(0);
let lock = $state('');
let el: HTMLDivElement | undefined = $state();

onMount(() => {
	if (!isFinePointer() || prefersReducedMotion()) return;
	h = true;
	v = true;

	const onMove = (e: PointerEvent) => {
		x = e.clientX;
		y = e.clientY;
		// e.target is not guaranteed to be an Element (window, document, text nodes), and
		// closest() only exists on Elements. Guard instead of trusting the cast.
		const target = e.target instanceof Element ? e.target.closest('[data-frame]') : null;
		lock = target?.getAttribute('data-frame') ?? '';
	};
	window.addEventListener('pointermove', onMove, { passive: true });
	return () => window.removeEventListener('pointermove', onMove);
});
</script>

{#if h && v}
	<div class="cross" aria-hidden="true" bind:this={el}>
		<div class="line-x" style:top="{y}px"></div>
		<div class="line-y" style:left="{x}px"></div>
		<div class="readout mono--micro" class:near-top={y < 96} style:top="{y + 14}px" style:left="{x + 12}px">
			{String(Math.round(x)).padStart(4, '0')} {String(Math.round(y)).padStart(4, '0')}
			{#if lock}<span class="lock">· {lock}</span>{/if}
		</div>
	</div>
{/if}

<style>
	.cross {
		position: fixed;
		inset: 0;
		z-index: var(--z-cursor);
		pointer-events: none;
	}
	.line-x {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--accent);
		opacity: 0.32;
	}
	.line-y {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--accent);
		opacity: 0.32;
	}
	.readout {
		position: absolute;
		background: var(--ground);
		border: var(--hair) solid var(--line);
		padding: 2px 5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.lock {
		color: var(--accent);
	}
	/* the chrome strip already shows XY; a second readout there is noise */
	.near-top {
		display: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.cross {
			display: none;
		}
	}
</style>
