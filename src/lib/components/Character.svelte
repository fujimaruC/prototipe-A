<script lang="ts">
	/**
	 * Fujimaru. Decorative by contract: aria-hidden, pointer-events only on the sprite itself,
	 * and absent entirely below 640px and under reduced motion. Nothing here carries information
	 * that is not also in text.
	 */
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { app } from '$lib/stores/app.svelte';
	import { createCharacter, characterEnabled, type CharacterHandle } from '$lib/character/engine';
	import { bubbles } from '$lib/content';
	import { tick as sfx } from '$lib/fx/audio';
	import { FRAMES, type SpriteFrame } from '$lib/character/sprite';

	let host: HTMLDivElement | undefined = $state();
	let frame = $state<SpriteFrame>('idle');
	let on = $state(false);
	let bubble = $state('');
	let flip = $state(false);
	/** Right-aligned sprite: anchor the bubble to its right edge so it cannot leave the page. */
	let anchorRight = $state(false);
	let bubbleTimer = 0;
	let reactionTimer = 0;
	let taps = 0;

	/** Which section is the character standing in? Read from the platform's nearest section. */
	function bubbleFor(el: HTMLElement): string {
		// Walk up until a section with a real id: closest() can return a wrapper whose id is
		// empty, which silently resolved every line to the home copy.
		let node: HTMLElement | null = el;
		while (node) {
			if ((node.tagName === 'SECTION' || node.tagName === 'HEADER') && node.id) {
				return bubbles[node.id] ?? '';
			}
			node = node.parentElement;
		}
		return '';
	}

	function say(text: string) {
		window.clearTimeout(bubbleTimer);
		// An empty line means "no line for this section": clear it, never leave stale text.
		if (!text) {
			bubble = '';
			return;
		}
		// Only restart the timer when the line actually changes, or a re-seat every frame
		// would keep it on screen forever.
		if (text === bubble) return;
		// No room above the sprite: put the line underneath instead of pushing it off-screen.
		const r = host?.getBoundingClientRect();
		const chromeBottom = document.querySelector('.chrome-wrap')?.getBoundingClientRect().bottom ?? 0;
		flip = r ? r.top - chromeBottom < 72 : false;
		anchorRight = r ? r.left + r.width / 2 > window.innerWidth / 2 : false;
		bubble = text;
		bubbleTimer = window.setTimeout(() => (bubble = ''), 4200);
	}

	const rows = $derived(FRAMES[frame]);

	onMount(() => {
		// The sprite div only exists once `on` is true, so the eligibility check must not read
		// `host` first: that is a deadlock (no host -> return -> never render -> no host).
		if (!characterEnabled()) return;
		on = true;

		let handle: CharacterHandle | null = null;
		let dragStart = { x: 0, y: 0, t: 0 };
		let dragging = false;
		let pressed = false;

		// the engine needs the node after it is laid out
		requestAnimationFrame(() => {
			if (!host) {
				console.warn('[fujimaru] sprite node did not bind');
				return;
			}
			handle = createCharacter({
				el: host,
				scale: 2,
				onMood: (m) => {
					if (m === 'walk') frame = 'walk';
					else if (m === 'idle') frame = 'idle';
					// leaving a platform: drop the old line, or it narrates the wrong section
					if (m === 'walk' || m === 'portalOut' || m === 'portalIn') {
						window.clearTimeout(bubbleTimer);
						bubble = '';
					}
					if (app.sound && (m === 'portalOut' || m === 'portalIn')) sfx('portal');
				},
				onLand: (p) => say(bubbleFor(p.el)),
				onSettle: (p) => {
					// exposed for QA: which platform settled, and what line it resolved to
					const w = window as Window & {
						__settleCount?: number;
						__lastSettle?: { id: string; text: string; closest: string | null };
					};
					w.__settleCount = (w.__settleCount ?? 0) + 1;
					const text = bubbleFor(p.el);
					w.__lastSettle = {
						id: p.el.id || p.el.className,
						text,
						closest: p.el.closest('section, header')?.id ?? null
					};
					say(text);
				}
			});
			window.__fujimaru = handle;
		});

		const onDown = (e: PointerEvent) => {
			if (!host) return;
			const r = host.getBoundingClientRect();
			if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;

			/*
			 * A press is not a drag. Starting the drag on pointerdown meant every tap became a
			 * throw, and the resulting walk overwrote the wave before it was ever visible.
			 * Track the press, and only promote it to a drag once the pointer actually moves.
			 */
			pressed = true;
			dragging = false;
			dragStart = { x: e.clientX, y: e.clientY, t: performance.now() };
			host.setPointerCapture(e.pointerId);
			gsap.killTweensOf(host);
		};

		const onMove = (e: PointerEvent) => {
			if (!pressed || !host) return;
			if (!dragging) {
				// 6px of travel before this counts as a drag rather than a tap
				const travelled = Math.hypot(e.clientX - dragStart.x, e.clientY - dragStart.y);
				if (travelled < 6) return;
				dragging = true;
				if (app.sound) sfx('scratch');
			}
			// GSAP owns the transform. Writing style.transform here would be overwritten by the
			// next tween and the sprite would jump back mid-drag.
			gsap.set(host, { x: e.clientX - 24, y: e.clientY - 24 + window.scrollY });
		};

		const onUp = (e: PointerEvent) => {
			if (!pressed || !host) return;
			pressed = false;

			if (!dragging) {
				// A tap: react, do not travel.
				taps += 1;
				window.clearTimeout(reactionTimer);
				window.clearTimeout(blinkTimer);
				frame = taps >= 2 ? 'love' : 'wave';
				if (app.sound) sfx(taps >= 2 ? 'chime' : 'hover');
				reactionTimer = window.setTimeout(() => {
					frame = 'idle';
					taps = 0;
				}, 900);
				return;
			}
			dragging = false;
			const dt = Math.max(1, performance.now() - dragStart.t);
			const vx = ((e.clientX - dragStart.x) / dt) * 1000;
			const vy = ((e.clientY - dragStart.y) / dt) * 1000;

			// throw: short physics hop, then settle onto the nearest platform
			const tx = e.clientX - 24 + vx * 0.12;
			const ty = e.clientY - 24 + window.scrollY + vy * 0.12;
			gsap.to(host, {
				x: tx,
				y: ty,
				duration: 0.32,
				ease: 'power3.out',
				onComplete: () => handle?.summon()
			});
		};

		let blinkTimer = window.setTimeout(function blink() {
			if (frame === 'idle') {
				frame = 'blink';
				window.setTimeout(() => {
					if (frame === 'blink') frame = 'idle';
				}, 140);
			}
			blinkTimer = window.setTimeout(blink, 2600 + Math.random() * 3400);
		}, 2000);

		window.addEventListener('pointerdown', onDown);
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);

		return () => {
			window.clearTimeout(bubbleTimer);
			window.clearTimeout(reactionTimer);
			window.clearTimeout(blinkTimer);
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			handle?.destroy();
		};
	});
</script>

{#if on}
	<div class="fuji" bind:this={host} aria-hidden="true" data-mood={app.characterMood} data-frame={frame} class:shades={app.konami}>
		<svg viewBox="0 0 24 24" width="48" height="48" role="presentation">
			{#each rows as row, y (y)}
				{#each [...row] as ch, x (x)}
					{#if ch !== '.'}
						<rect
							x={x}
							y={y}
							width="1"
							height="1"
							fill={ch === '#' ? 'var(--ink)' : ch === 'o' ? 'var(--ground)' : 'var(--accent)'}
						/>
					{/if}
				{/each}
			{/each}
		</svg>
		{#if bubble}
			<p class="bubble mono--micro" class:flip class:right={anchorRight}>{bubble}</p>
		{/if}
	</div>
{/if}

<style>
	.fuji {
		position: absolute;
		left: 0;
		top: 0;
		width: 48px;
		height: 48px;
		z-index: 3;
		cursor: grab;
		will-change: transform;
		pointer-events: auto;
	}
	.fuji:active {
		cursor: grabbing;
	}
	svg {
		display: block;
		image-rendering: pixelated;
		shape-rendering: crispEdges;
	}
	/* the blink frame is swapped in by the component, this only softens the transition */
	.fuji[data-mood='idle'] svg {
		transition: transform 120ms var(--ease-draw);
	}
	/* Konami: sunglasses. Drawn over the visor band, scaled with the sprite. */
	.fuji.shades::after {
		content: '';
		position: absolute;
		left: 20%;
		top: 27%;
		width: 60%;
		height: 14%;
		background: var(--accent);
		box-shadow: 0 0 0 2px var(--ink);
	}
	.bubble {
		position: absolute;
		left: 0;
		bottom: calc(100% + 6px);
		width: max-content;
		max-width: min(220px, 42vw);
		background: var(--ink);
		color: var(--ground);
		padding: 5px 8px;
		letter-spacing: 0.06em;
		text-transform: none;
		line-height: 1.35;
		pointer-events: none;
	}
	.bubble.right {
		left: auto;
		right: 0;
	}
	.bubble.right::after {
		left: auto;
		right: 12px;
	}
	.bubble.flip {
		bottom: auto;
		top: calc(100% + 6px);
	}
	.bubble.flip::after {
		top: auto;
		bottom: 100%;
		border-top-color: transparent;
		border-bottom-color: var(--ink);
	}
	.bubble::after {
		content: '';
		position: absolute;
		left: 12px;
		top: 100%;
		border: 4px solid transparent;
		border-top-color: var(--ink);
	}
	@media (max-width: 639px) {
		.fuji {
			width: 40px;
			height: 40px;
		}
		.fuji svg {
			width: 40px;
			height: 40px;
		}
		.bubble {
			max-width: 60vw;
			font-size: 10px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fuji {
			display: none;
		}
	}
</style>
