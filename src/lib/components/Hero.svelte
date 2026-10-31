<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { identity, ports } from '$lib/content';
	import { app } from '$lib/stores/app.svelte';
	import { prefersReducedMotion } from '$lib/fx/env';
	import { onFrame } from '$lib/fx/driver';
	import { getLayer } from '$lib/gl/instance';
	import Cable from './Cable.svelte';
	import PacketField from './PacketField.svelte';
	import TestMarker from '$lib/components/TestMarker.svelte';

	let nameEl: HTMLHeadingElement | undefined = $state();
	let heroEl: HTMLElement | undefined = $state();
	let ready = $state(false);
	const reduced = $derived(prefersReducedMotion());

	onMount(() => {
		ready = true;
		if (prefersReducedMotion()) return;

		// The band must follow the hero as it scrolls, otherwise the living layer stays pinned
		// to the top of the viewport and dots appear over later sections.
		const publish = () => {
			const layer = getLayer();
			if (!layer || !heroEl) return;
			const r = heroEl.getBoundingClientRect();
			const vh = window.innerHeight;
			if (r.bottom < -40 || r.top > vh + 40) {
				layer.setHeroRect({ x: 0, y: -10, w: 1, h: 0.0001 });
				return;
			}
			layer.setHeroRect({ x: 0, y: 1 - (r.top + r.height) / vh, w: 1, h: r.height / vh });
		};
		const stopBand = onFrame(publish);

		// Name physics: each letter springs away from the cursor, flicks on click.
		const letters = nameEl?.querySelectorAll<HTMLElement>('.glyph');
		if (!letters || app.tier === 'low') {
			return stopBand;
		}

		const state = [...letters].map((el) => ({
			el,
			x: gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' }),
			y: gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' })
		}));

		const onMove = (e: PointerEvent) => {
			for (const s of state) {
				const r = s.el.getBoundingClientRect();
				const cx = r.left + r.width / 2;
				const cy = r.top + r.height / 2;
				const dx = cx - e.clientX;
				const dy = cy - e.clientY;
				const d = Math.hypot(dx, dy);
				const reach = 190;
				if (d < reach) {
					const f = (1 - d / reach) * 16;
					s.x((dx / (d || 1)) * f);
					s.y((dy / (d || 1)) * f);
				} else {
					s.x(0);
					s.y(0);
				}
			}
		};

		const onClick = (e: PointerEvent) => {
			const target = e.target as HTMLElement;
			const glyph = target.closest<HTMLElement>('.glyph');
			if (!glyph) return;
			gsap.fromTo(
				glyph,
				{ scale: 1.18, rotate: -6 },
				{ scale: 1, rotate: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }
			);
		};

		window.addEventListener('pointermove', onMove, { passive: true });
		window.addEventListener('pointerdown', onClick);

		return () => {
			stopBand();
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerdown', onClick);
		};
	});
</script>

<header class="hero" id="home" data-frame="HOME" bind:this={heroEl}>
	<PacketField />
	<div class="hero-grid">
		<div class="name-block">
			<p class="mono role">{identity.role}</p>
			<h1 class="name" data-platform bind:this={nameEl} class:ready>
				<span class="line" aria-hidden="true">
					{#each [...identity.first] as ch, i (i)}
						<span class="glyph" style:--i={i}>{ch}</span>
					{/each}
				</span>
				<span class="line line-2" aria-hidden="true">
					{#each [...identity.last] as ch, i (i)}
						<span class="glyph" style:--i={i + identity.first.length}>{ch}</span>
					{/each}
				</span>
				<span class="sr-only">{identity.first} {identity.last}</span>
			</h1>

			<div class="fuji-slot" data-platform aria-hidden="true">
				<span class="slot-hint mono--micro">U0 · FUJIMARU</span>
				<span class="slot-rule" aria-hidden="true"></span>
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
		<ul class="portstrip" data-platform aria-label="Port map">
			{#each ports as p (p.id)}
				<li class="port" data-frame={p.id}>
					<span class="pid mono--micro">{p.id}</span>
					<span class="plabel mono">{p.label}</span>
					<span class="pdetail">{p.detail}</span>
				</li>
			{/each}
		</ul>
	</div>

	<div class="hero-foot">
		<span class="mono--micro">{reduced ? 'REDUCED MOTION // FIELD OFF' : 'TAP A PACKET'} <b>+XP</b></span>
		<TestMarker id="TP-05" />
		<span class="mono--micro hide-sm">CLICK THE FIELD</span>
	</div>
</header>

<style>
	.hero {
		position: relative;
		/* no bottom padding: the opaque foot plate must reach the section border, or the
		   living layer shows through as a dotted strip under the port labels */
		padding: var(--s-7) 0 0;
		border-bottom: var(--hair) solid var(--line-strong);
	}
	.hero-grid {
		position: relative;
		z-index: 1;
		display: grid;
		/* the 1.55fr name column now reserves a real gutter, so the "O" cannot reach the copy */
		grid-template-columns: minmax(0, 1.42fr) minmax(300px, 1fr);
		gap: clamp(32px, 5vw, 96px);
		align-items: start;
	}
	.role {
		color: var(--ink-2);
		margin-bottom: var(--s-4);
	}
	.name {
		font-family: var(--font-display);
		font-size: var(--text-name);
		line-height: 0.8;
		letter-spacing: -0.05em;
		font-weight: 800;
		font-stretch: 76%;
		text-transform: uppercase;
		margin-left: -0.05em;
		display: flex;
		flex-direction: column;
		overflow: visible;
	}
	.line {
		display: block;
		white-space: nowrap;
	}
	.line-2 {
		display: block;
	}
	.glyph {
		display: inline-block;
		will-change: transform;
		transition: none;
	}
	/* Never hide the name: it is the LCP element and it must survive no-JS.
	   The entrance is transform-only, so content is visible at every frame. */
	.name.ready .glyph {
		animation: glyph-in 620ms var(--ease-draw) both;
		animation-delay: calc(var(--i) * 18ms);
	}
	@keyframes glyph-in {
		from {
			transform: translateY(0.1em) scaleY(0.96);
		}
		to {
			transform: none;
		}
	}
	.hero-side {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		padding: var(--s-5);
		/* opaque plate: the copy never sits directly on the living layer */
		background: var(--ground);
		border-left: var(--hair) solid var(--line);
	}
	.lede {
		font-size: var(--text-body);
		line-height: 1.6;
		max-width: 40ch;
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
		margin-top: var(--s-2);
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
	.cta.ghost:hover,
	.cta:hover {
		background: var(--accent);
		color: var(--accent-ink);
		border-color: var(--accent);
	}
	/* Mobile-only avatar ledge: an empty band the character stands in, so it never has to
	   float over the copy. Hidden on desktop, where the port strip is its home. */
	.fuji-slot {
		display: none;
	}
	@media (max-width: 767px) {
		/* A labelled compartment for the character, so the avatar has a home that reads as part
		   of the drawing rather than floating over the copy. */
		.fuji-slot {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--s-3);
			min-height: 68px;
			margin-top: var(--s-5);
			padding: 0 0 0 var(--s-2);
			border: var(--hair) solid var(--line);
			border-right: 0;
		}
		.slot-rule {
			flex: 1;
			height: 1px;
			background: var(--line);
		}
		.slot-hint {
			color: var(--ink-3);
			white-space: nowrap;
			order: 1;
		}
		.slot-rule {
			order: 2;
		}
	}
	.strip-wrap {
		position: relative;
		margin-top: var(--s-7);
		padding-top: 34px;
	}
	.portstrip {
		background: var(--ground);
		list-style: none;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0;
		margin: 0;
		padding: 0;
		border-top: var(--hair) solid var(--line);
	}
	.port {
		padding: var(--s-3) var(--s-3) var(--s-3) 0;
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
	.hero-foot {
		position: relative;
		z-index: 1;
		align-items: center;
		background: var(--ground);
		padding: var(--s-3) 0 var(--s-6);
		display: flex;
		justify-content: space-between;
		gap: var(--s-4);
		padding-top: var(--s-3);
		color: var(--ink-3);
	}
	.hero-foot b {
		color: var(--accent);
		font-weight: 600;
	}
	@media (max-width: 1023px) {
		.hero-grid {
			grid-template-columns: 1fr;
			gap: var(--s-5);
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
			font-size: clamp(2.9rem, 16vw, 5rem);
		}
		.aliases {
			grid-template-columns: 1fr;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.name.ready .glyph {
			animation: none;
		}
	}
</style>
