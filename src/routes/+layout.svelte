<script lang="ts">
import '$lib/styles/tokens.css';
import { onMount, type Snippet } from 'svelte';
import { page } from '$app/state';
import Character from '$lib/components/Character.svelte';
import Chrome from '$lib/components/Chrome.svelte';
import Crosshair from '$lib/components/Crosshair.svelte';
import CursorLens from '$lib/components/CursorLens.svelte';
import GlCanvas from '$lib/components/GlCanvas.svelte';
import JumpIndex from '$lib/components/JumpIndex.svelte';
import Preloader from '$lib/components/Preloader.svelte';
import { startDriver, stopDriver } from '$lib/fx/driver';
import { prefersReducedMotion } from '$lib/fx/env';
import { app, hydrate, setMode } from '$lib/stores/app.svelte';

let { children }: { children: Snippet } = $props();

// Children mount before this component's onMount, so hydrate at module scope on the client;
// otherwise app.ready is still false when GlCanvas/CursorLens first evaluate.
if (typeof window !== 'undefined') hydrate();

const KONAMI = [
	'ArrowUp',
	'ArrowUp',
	'ArrowDown',
	'ArrowDown',
	'ArrowLeft',
	'ArrowRight',
	'ArrowLeft',
	'ArrowRight',
	'b',
	'a',
];
let seq: string[] = [];
let glitch = $state(false);

onMount(() => {
	hydrate();
	if (!prefersReducedMotion()) startDriver();

	const onKey = (e: KeyboardEvent) => {
		const target = e.target as HTMLElement | null;
		const typing =
			target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

		if (!typing && (e.key === '/' || e.key === '~') && !app.indexOpen) {
			e.preventDefault();
			app.indexOpen = true;
			return;
		}
		if (!typing && e.key.toLowerCase() === 'n' && e.altKey) {
			e.preventDefault();
			setMode(app.mode === 'light' ? 'negative' : 'light');
		}

		seq = [...seq, e.key].slice(-KONAMI.length);
		if (seq.join('|').toLowerCase() === KONAMI.join('|').toLowerCase()) {
			seq = [];
			if (prefersReducedMotion()) return;
			glitch = true;
			window.setTimeout(() => (glitch = false), 1400);
		}
	};
	window.addEventListener('keydown', onKey);
	return () => {
		window.removeEventListener('keydown', onKey);
		stopDriver();
	};
});

$effect(() => {
	document.documentElement.dataset.mode = app.mode;
});
</script>

<svelte:head>
	<meta name="theme-color" content={app.mode === 'negative' ? '#0A0A0A' : '#ECECEC'} />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>
<span hidden aria-hidden="true">Q0tUe3NoMTNsZF93NGxsfQ</span>

<GlCanvas />
<Preloader />
<CursorLens />
<Character />

<div class="frame" class:glitch>
	<span class="reg reg-tl" aria-hidden="true"></span>
	<span class="reg reg-tr" aria-hidden="true"></span>
	<span class="reg reg-bl" aria-hidden="true"></span>
	<span class="reg reg-br" aria-hidden="true"></span>
	<div class="chrome-wrap">
		<Chrome />
	</div>
	<main id="main">
		{@render children()}
	</main>
	<footer class="foot">
		<span class="mono--micro">Drawing 01 · rev {page.url.pathname.replace(/\/$/, '').endsWith('/secret') ? 'B' : 'A'}</span>
		<span class="mono--micro">Built with SvelteKit · no tracking · no cookies</span>
	</footer>
</div>

<JumpIndex />
<Crosshair />

<style>
	.reg {
		position: absolute;
		width: 11px;
		height: 11px;
		pointer-events: none;
		z-index: 2;
	}
	.reg::before,
	.reg::after {
		content: '';
		position: absolute;
		background: var(--ink);
	}
	.reg::before {
		left: 5px;
		top: 0;
		width: 1px;
		height: 11px;
	}
	.reg::after {
		top: 5px;
		left: 0;
		height: 1px;
		width: 11px;
	}
	.reg-tl {
		top: 6px;
		left: 6px;
	}
	.reg-tr {
		top: 6px;
		right: 6px;
	}
	.reg-bl {
		bottom: 6px;
		left: 6px;
	}
	.reg-br {
		bottom: 6px;
		right: 6px;
	}
	@media (max-width: 767px) {
		.reg {
			display: none;
		}
	}
	.frame {
		/* own stacking context: everything inside sits above the fixed GL canvas */
		z-index: 1;
		max-width: var(--sheet-max);
		margin: 0 auto;
		padding: 0 var(--gutter);
		position: relative;
	}
	.chrome-wrap {
		position: sticky;
		top: 0;
		z-index: var(--z-chrome);
		background: var(--ground);
		border-bottom: var(--hair) solid var(--line-strong);
	}
	main {
		position: relative;
		z-index: var(--z-sheet);
	}
	.foot {
		display: flex;
		justify-content: space-between;
		gap: var(--s-4);
		flex-wrap: wrap;
		border-top: var(--hair) solid var(--line-strong);
		padding: var(--s-4) 0 var(--s-6);
		color: var(--ink-3);
	}
	.glitch {
		animation: glitch var(--dur-5) steps(6, end) 1;
	}
	@keyframes glitch {
		0%,
		100% {
			transform: none;
			filter: none;
		}
		20% {
			transform: translate(-2px, 1px);
			filter: invert(1);
		}
		40% {
			transform: translate(2px, -1px);
			filter: none;
		}
		60% {
			transform: translate(-1px, 0);
			filter: invert(1);
		}
		80% {
			transform: none;
			filter: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.glitch {
			animation: none;
		}
	}
</style>
