<script lang="ts">
	/**
	 * The single WebGL canvas. Mounted after first paint, only when the tier allows GL.
	 * Everything else (hero network, heat layer) is a pass inside this one context.
	 */
	import { onMount } from 'svelte';
	import { app, downgradeTier } from '$lib/stores/app.svelte';
	import { canUseGl } from '$lib/fx/quality';
	import { prefersReducedMotion } from '$lib/fx/env';
	import { setLayer } from '$lib/gl/instance';
	import { burstAt } from '$lib/gl/instance';

	let canvas: HTMLCanvasElement | undefined = $state();
	let mounted = $state(false);
	let lowStreak = 0;
	// SSR-safe: this component is prerendered, so `window` does not exist at build time.
	const pinnedTier =
		typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('quality');

	onMount(() => {
		if (prefersReducedMotion() || !canUseGl(app.tier)) return;

		let dispose: (() => void) | null = null;
		let cancelled = false;

		const boot = async () => {
			if (!canvas || cancelled) return;
			const { createLayer } = await import('$lib/gl/layer');
			if (cancelled || !canvas) return;
			let layer;
			try {
				layer = createLayer({
				tier: app.tier,
				canvas,
				onFps: (fps) => {
					if (pinnedTier) return;
					if (fps < 50) {
						lowStreak += 1;
						if (lowStreak >= 2 && app.tier !== 'low') {
							downgradeTier();
							lowStreak = 0;
						}
					} else {
						lowStreak = 0;
					}
				}
				});
			} catch (err) {
				console.warn('[gl] layer failed to start:', err);
				return;
			}
			setLayer(layer);
			mounted = true;
			dispose = () => {
				setLayer(null);
				layer.destroy();
			};

			const onClick = (e: PointerEvent) => burstAt(e.clientX, e.clientY);
			window.addEventListener('pointerdown', onClick);
			const off = () => window.removeEventListener('pointerdown', onClick);
			const prev = dispose;
			dispose = () => {
				off();
				prev?.();
			};
		};

		// A plain timeout, not requestIdleCallback: the GSAP ticker runs continuously, so the
		// browser never reports an idle window and the layer would never boot.
		const timer = window.setTimeout(() => void boot(), 320);

		return () => {
			cancelled = true;
			if (timer) window.clearTimeout(timer);
			dispose?.();
		};
	});

	$effect(() => {
		const negative = app.mode === 'negative';
		import('$lib/gl/instance').then(({ getLayer }) => getLayer()?.setTheme(negative));
	});
</script>

{#if app.ready && !prefersReducedMotion() && canUseGl(app.tier)}
	<canvas bind:this={canvas} class="gl" class:hidden={!mounted} aria-hidden="true"></canvas>
{/if}

<style>
	.gl {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		/* height is driven per frame by the layer, to the hero band */
		height: 100%;
		z-index: 0;
		pointer-events: none;
		opacity: 1;
		transition: opacity 400ms var(--ease-draw);
	}
	.gl.hidden {
		opacity: 0;
	}
</style>
