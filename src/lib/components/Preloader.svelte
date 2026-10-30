<script lang="ts">
	/**
	 * Plotter job: a counter runs to 100 while the sheet border and grid are drawn with
	 * stroke-dashoffset, then the whole plate peels away along a clip-path. The page underneath
	 * is already rendered, so there is no cut — the peel is the handoff.
	 */
	import { onMount, tick } from 'svelte';
	import { gsap } from 'gsap';
	import { app, markSeen } from '$lib/stores/app.svelte';
	import { prefersReducedMotion } from '$lib/fx/env';

	let { onDone }: { onDone?: () => void } = $props();

	let root: HTMLDivElement | undefined = $state();
	let counter = $state(0);
	// Starts visible so the prerendered HTML already holds the plate: no blank first paint.
	let show = $state(true);

	onMount(() => {
		// Already seen, or motion is off: drop the plate in this same tick.
		if (prefersReducedMotion() || app.introSeen) {
			show = false;
			onDone?.();
			return;
		}
		let cleanup: (() => void) | undefined;
		void run().then((fn) => (cleanup = fn));
		return () => cleanup?.();
	});

	async function run(): Promise<(() => void) | undefined> {

		// The plate is rendered by {#if show}, so the nodes exist only after this tick.
		await tick();
		const scope = root;
		if (!scope) return;

		const tl = gsap.timeline({
			onComplete: () => {
				show = false;
				markSeen();
				onDone?.();
			}
		});
		const framePath = scope.querySelector('.frame-path');
		const preName = scope.querySelector('.pre-name');

		const state = { n: 0 };
		tl.to(state, {
			n: 100,
			duration: 1.15,
			ease: 'power2.inOut',
			onUpdate: () => (counter = Math.round(state.n))
		});
		if (framePath) {
			tl.fromTo(
				framePath,
				{ strokeDashoffset: 1200 },
				{ strokeDashoffset: 0, duration: 0.9, ease: 'power2.out' },
				0
			);
		}
		if (preName) {
			tl.fromTo(
				preName,
				{ opacity: 0, letterSpacing: '0.4em' },
				{ opacity: 1, letterSpacing: '-0.03em', duration: 0.7, ease: 'power3.out' },
				0.35
			);
		}
		const plate = root;
		if (plate) {
			tl.to(plate, {
				clipPath: 'inset(0 0 100% 0)',
				duration: 0.62,
				ease: 'power3.inOut'
			});
		} else {
			tl.to({}, { duration: 0.62 });
		}

		const skip = () => {
			if (tl.progress() < 0.98) tl.progress(0.985);
		};
		window.addEventListener('keydown', skip, { once: true });
		window.addEventListener('pointerdown', skip, { once: true });

		return () => {
			tl.kill();
			window.removeEventListener('keydown', skip);
			window.removeEventListener('pointerdown', skip);
		};
	}
</script>

{#if show}
	<div class="pre" bind:this={root} role="status" aria-live="polite" aria-label="Loading the sheet">
		<svg class="frame-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
			<path
				class="frame-path"
				d="M2 2 H98 V98 H2 Z"
				fill="none"
				stroke="var(--ink)"
				stroke-width="0.25"
				vector-effect="non-scaling-stroke"
			/>
		</svg>
		<div class="mid">
			<p class="pre-name">JERICHO MIKAEL</p>
			<p class="job mono--micro">PLOTTING SHEET 01</p>
			<div class="bar" aria-hidden="true">
				<span style:width="{counter}%"></span>
			</div>
		</div>
		<p class="count mono" aria-hidden="true">{String(counter).padStart(3, '0')}</p>
		<p class="hint mono--micro">any key to skip</p>
	</div>
{/if}

<style>
	.pre {
		position: fixed;
		inset: 0;
		z-index: calc(var(--z-overlay) + 10);
		background: var(--ground);
		display: grid;
		place-items: center;
		clip-path: inset(0 0 0 0);
		will-change: clip-path;
	}
	.frame-svg {
		position: absolute;
		inset: 18px;
		width: calc(100% - 36px);
		height: calc(100% - 36px);
	}
	.frame-path {
		stroke-dasharray: 1200;
	}
	.mid {
		text-align: center;
		padding: 0 24px;
	}
	.pre-name {
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 6vw, 4rem);
		font-weight: 800;
		font-stretch: 78%;
		text-transform: uppercase;
		line-height: 0.9;
		margin-bottom: 12px;
	}
	.job {
		color: var(--ink-3);
		margin-bottom: 18px;
	}
	.bar {
		width: min(280px, 60vw);
		height: 2px;
		background: var(--line);
		margin: 0 auto;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
	}
	.count {
		position: absolute;
		right: 34px;
		bottom: 30px;
		font-size: clamp(2rem, 7vw, 5rem);
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}
	.hint {
		position: absolute;
		left: 34px;
		bottom: 34px;
		color: var(--ink-3);
	}
	@media (prefers-reduced-motion: reduce) {
		.pre {
			display: none;
		}
	}
</style>
