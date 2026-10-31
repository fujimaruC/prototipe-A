<script lang="ts">
	/**
	 * The hero's packet field. Sits behind the copy, collects on tap or click, and feeds XP.
	 * Touch and pointer share one path, so the phone version is the same feature.
	 */
	import { onMount } from 'svelte';
	import { createField, type FieldHandle } from '$lib/game/field';
	import { addPackets, resetCombo, game } from '$lib/game/state.svelte';
	import { pushAchievement } from '$lib/game/toasts.svelte';
	import { tick as sfx } from '$lib/fx/audio';
	import { app } from '$lib/stores/app.svelte';
	import { prefersReducedMotion } from '$lib/fx/env';

	let canvas: HTMLCanvasElement | undefined = $state();
	let handle: FieldHandle | null = null;
	let pops = $state<{ id: number; x: number; y: number; n: number }[]>([]);
	let popId = 1;
	let comboDrop = 0;

	function pop(x: number, y: number, n: number) {
		const id = popId++;
		pops = [...pops, { id, x, y, n }];
		window.setTimeout(() => (pops = pops.filter((p) => p.id !== id)), 620);
	}

	onMount(() => {
		if (!canvas) return;
		if (prefersReducedMotion()) return;

		handle = createField({
			canvas,
			maxNodes: app.tier === 'low' ? 8 : 14,
			onCollect: (x, y) => {
				const { unlocks, levelUp } = addPackets(1);
				pop(x, y, 1);
				if (app.sound) sfx('found');
				if (levelUp && !unlocks.some((u) => u.levelUp)) {
					// Level crossed purely from packet XP (no achievement in the same click)
					pushAchievement({ id: 'lvl', label: `Level ${game.level}`, detail: 'The sheet revises itself.', xp: 0 }, true);
				}
				for (const u of unlocks) pushAchievement(u.achievement, u.levelUp);
				window.clearTimeout(comboDrop);
				comboDrop = window.setTimeout(resetCombo, 2400);
			}
		});

		// one delegated listener: the canvas is behind the copy, so the hero handles the tap
		const onPointer = (e: PointerEvent) => {
			const rect = canvas?.getBoundingClientRect();
			if (!rect) return;
			if (e.clientY < rect.top || e.clientY > rect.bottom) return;
			handle?.tryCollect(e.clientX, e.clientY);
		};
		window.addEventListener('pointerdown', onPointer);

		return () => {
			window.removeEventListener('pointerdown', onPointer);
			window.clearTimeout(comboDrop);
			// A combo must not survive the field: without this, leaving the hero mid-combo and
			// returning let the next single packet complete "five in one window".
			resetCombo();
			handle?.destroy();
		};
	});
</script>

<div class="field" aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
	{#each pops as p (p.id)}
		<span class="pop mono--micro" style:left="{p.x}px" style:top="{p.y}px">+{p.n}</span>
	{/each}
</div>

<style>
	.field {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 0;
	}
	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
	.pop {
		position: fixed;
		transform: translate(-50%, -50%);
		color: var(--accent);
		font-weight: 700;
		animation: pop 620ms var(--ease-cable) forwards;
		pointer-events: none;
		z-index: calc(var(--z-chrome) + 2);
	}
	@keyframes pop {
		from {
			opacity: 1;
			transform: translate(-50%, -50%) scale(0.8);
		}
		to {
			opacity: 0;
			transform: translate(-50%, -160%) scale(1.15);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.field {
			display: none;
		}
	}
</style>
