<script lang="ts">
import { onMount } from 'svelte';
import { identity, ports } from '$lib/content';
import { paintDither } from '$lib/fx/dither';
import { prefersReducedMotion } from '$lib/fx/env';
import { app, markSeen } from '$lib/stores/app.svelte';
import Cable from './Cable.svelte';

let canvas: HTMLCanvasElement | undefined = $state();
let resolving = $state(false);
let done = $state(false);
let stage: HTMLDivElement | undefined = $state();

onMount(() => {
	if (prefersReducedMotion() || app.introSeen || !canvas) {
		done = true;
		return;
	}
	resolving = true;
	const el = canvas;
	const ctx = el.getContext('2d');
	if (!ctx) {
		done = true;
		return;
	}
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const rect = el.getBoundingClientRect();
	el.width = Math.round(rect.width * dpr);
	el.height = Math.round(rect.height * dpr);
	ctx.scale(dpr, dpr);

	const styles = getComputedStyle(document.documentElement);
	const ink = styles.getPropertyValue('--ink').trim() || '#0a0a0a';
	const ground = styles.getPropertyValue('--ground').trim() || '#ececec';

	let start = 0;
	let raf = 0;
	const dur = 620;

	const draw = (now: number) => {
		if (!start) start = now;
		const t = Math.min(1, (now - start) / dur);
		paintDither(ctx, {
			width: rect.width,
			height: rect.height,
			cell: 4,
			progress: t * t,
			ink,
			ground,
			seed: 7,
		});
		if (t < 1) {
			raf = requestAnimationFrame(draw);
		} else {
			finish();
		}
	};

	const finish = () => {
		cancelAnimationFrame(raf);
		window.removeEventListener('keydown', finish);
		window.removeEventListener('pointerdown', finish);
		resolving = false;
		done = true;
		markSeen();
	};

	window.addEventListener('keydown', finish);
	window.addEventListener('pointerdown', finish);
	raf = requestAnimationFrame(draw);
	return () => {
		cancelAnimationFrame(raf);
		window.removeEventListener('keydown', finish);
		window.removeEventListener('pointerdown', finish);
	};
});
</script>

<header class="hero" id="home" data-frame="HOME">
	<div class="hero-grid">
		<div class="name-block">
			<p class="mono role">{identity.role}</p>
			<h1 class="name" class:resolved={done}>
				<span class="l1">{identity.first}</span>
				<span class="l2">{identity.last}</span>
			</h1>
			<div class="stage" bind:this={stage}>
				{#if resolving}
					<canvas bind:this={canvas} class="noise" aria-hidden="true"></canvas>
				{/if}
			</div>
		</div>

		<div class="hero-side">
			<p class="lede">{identity.tagline}</p>
			<dl class="aliases">
				{#each identity.aliases as a (a.label)}
					<div>
						<dt class="mono--micro">{a.label}</dt>
						<dd class="mono alias">{a.value}</dd>
						<dd class="note">{a.note}</dd>
					</div>
				{/each}
			</dl>
			<div class="ctas">
				<a class="cta" href="#cases" data-frame="P02">
					<span>Case files</span><span class="arrow" aria-hidden="true">→</span>
				</a>
				<a class="cta ghost" href="#record" data-frame="P03">
					<span>Record</span><span class="arrow" aria-hidden="true">→</span>
				</a>
			</div>
		</div>
	</div>

	<div class="strip-wrap">
		<Cable />
		<ul class="portstrip" aria-label="Port map">
			{#each ports as p (p.id)}
				<li class="port" data-frame={p.id}>
					<span class="pid mono--micro">{p.id}</span>
					<span class="plabel mono">{p.label}</span>
					<span class="pdetail">{p.detail}</span>
				</li>
			{/each}
		</ul>
	</div>
</header>

<style>
	.hero {
		position: relative;
		padding: var(--s-8) 0 var(--s-7);
		border-bottom: var(--hair) solid var(--line-strong);
	}
	.hero-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
		gap: clamp(24px, 4vw, 72px);
		align-items: start;
	}
	.role {
		color: var(--ink-2);
		margin-bottom: var(--s-5);
	}
	.name {
		font-family: var(--font-display);
		font-size: var(--text-name);
		line-height: 0.82;
		letter-spacing: -0.045em;
		font-weight: 800;
		font-stretch: 78%;
		text-transform: uppercase;
		display: flex;
		flex-direction: column;
		margin-left: -0.045em;
	}
	.l2 {
		color: var(--ink);
		position: relative;
	}
	.noise {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.stage {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.hero-side {
		display: flex;
		flex-direction: column;
		gap: var(--s-5);
		padding-top: var(--s-6);
	}
	.lede {
		font-size: var(--text-body);
		line-height: 1.62;
		max-width: 42ch;
		color: var(--ink-2);
	}
	.aliases {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--s-4);
		border-top: var(--hair) solid var(--line);
		padding-top: var(--s-4);
		margin: 0;
	}
	.aliases div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	dt {
		color: var(--ink-3);
	}
	.alias {
		font-size: 0.9rem;
		letter-spacing: 0.1em;
		color: var(--ink);
		margin: 0;
	}
	.note {
		margin: 0;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--ink-3);
		max-width: 24ch;
	}
	.ctas {
		display: flex;
		gap: var(--s-3);
		flex-wrap: wrap;
	}
	.cta {
		display: inline-flex;
		align-items: center;
		gap: var(--s-4);
		min-height: 48px;
		padding: 0 var(--s-5);
		border: var(--hair) solid var(--line-strong);
		background: var(--ink);
		color: var(--ground);
		text-decoration: none;
		font-family: var(--font-mono);
		font-size: var(--text-label);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		transition: background-color var(--dur-1) var(--ease-draw), color var(--dur-1) var(--ease-draw);
	}
	.cta .arrow {
		display: inline-block;
		transition: transform var(--dur-2) var(--ease-draw);
	}
	.cta:hover .arrow {
		transform: translateX(5px);
	}
	.cta.ghost {
		background: transparent;
		color: var(--ink);
	}
	.cta.ghost:hover {
		background: var(--ground-raised);
	}
	.cta:hover {
		background: var(--accent);
		color: var(--accent-ink);
		border-color: var(--accent);
	}
	.strip-wrap {
		position: relative;
		margin-top: var(--s-8);
		padding-top: 34px;
	}
	.portstrip {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0;
		margin: 0;
		padding: 0;
		border-top: var(--hair) solid var(--line);
	}
	.port {
		padding: var(--s-4) var(--s-3) var(--s-4) 0;
		border-right: var(--hair) solid var(--line);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.port:last-child {
		border-right: 0;
	}
	.pid {
		color: var(--accent);
	}
	.plabel {
		color: var(--ink);
	}
	.pdetail {
		font-size: 0.72rem;
		color: var(--ink-3);
		line-height: 1.35;
	}
	@media (max-width: 1023px) {
		.hero-grid {
			grid-template-columns: 1fr;
		}
		.hero-side {
			padding-top: 0;
		}
		.portstrip {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.port:nth-child(2n) {
			border-right: 0;
		}
		.port {
			border-bottom: var(--hair) solid var(--line);
		}
	}
	@media (max-width: 480px) {
		.name {
			font-size: clamp(3rem, 17vw, 5rem);
		}
		.aliases {
			grid-template-columns: 1fr;
		}
	}
</style>
