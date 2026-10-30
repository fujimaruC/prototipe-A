<script lang="ts">
	import { resolve } from '$app/paths';
import { page } from '$app/state';
import TestMarker from '$lib/components/TestMarker.svelte';
</script>

<svelte:head>
	<title>Port not found — 404</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="wrap">
	<p class="mono--micro code">ERR {page.status}</p>
	<div class="tp-row"><TestMarker id="TP-06" /></div>
	<h1 class="display">No route<br />on this sheet</h1>
	<p class="lede">
		Nothing is broken. This address just does not terminate on the sheet — the path you followed
		is not in the drawing.
	</p>
	<p class="mono--micro dead" aria-hidden="true">Q0tUe3doMF8xc19hbnN3M3Ixbmd9</p>
	<nav class="links">
		<a class="mono" href={resolve('/')}>Return to the sheet</a>
		<a class="mono ghost" href={resolve('/secret')}>Restricted sheet</a>
	</nav>
</div>

<style>
	.wrap {
		padding: var(--s-10) 0 var(--s-9);
		max-width: 720px;
	}
	.code {
		color: var(--accent);
		margin-bottom: var(--s-4);
	}
	.display {
		font-family: var(--font-display);
		font-size: clamp(2.8rem, 9vw, 7rem);
		line-height: 0.84;
		letter-spacing: -0.045em;
		font-weight: 800;
		font-stretch: 80%;
		text-transform: uppercase;
		margin-bottom: var(--s-5);
	}
	.lede {
		font-size: 1rem;
		line-height: 1.6;
		color: var(--ink-2);
		max-width: 48ch;
		margin-bottom: var(--s-6);
	}
	.dead {
		color: var(--ink-3);
		margin-bottom: var(--s-5);
		letter-spacing: 0.1em;
		overflow-wrap: anywhere;
	}
	.links {
		display: flex;
		gap: var(--s-3);
		flex-wrap: wrap;
	}
	.links a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 0 var(--s-4);
		border: var(--hair) solid var(--line-strong);
		text-decoration: none;
		background: var(--ink);
		color: var(--ground);
	}
	.links a.ghost {
		background: transparent;
		color: var(--ink);
	}
	.links a:hover {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}
</style>
