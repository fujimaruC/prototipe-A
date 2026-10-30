<script lang="ts">
	import { resolve } from '$app/paths';
import { onMount } from 'svelte';
import { contact, identity, meta, secret } from '$lib/content';
import { TOTAL_TEST_POINTS } from '$lib/flags';
import { allFound, app, hydrate } from '$lib/stores/app.svelte';

let ready = $state(false);
let unlocked = $state(false);

onMount(() => {
	hydrate();
	unlocked = allFound();
	ready = true;
});
</script>

<svelte:head>
	<title>Restricted sheet — {meta.siteName}</title>
	<meta name="description" content="Gated page for visitors who traced every test point on the drawing." />
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
	<p class="mono--micro crumb"><a href={resolve('/')}>← back to the sheet</a></p>

	{#if !ready}
		<p class="mono">Reading storage…</p>
	{:else if !unlocked}
		<section class="locked" aria-labelledby="locked-h">
			<h1 id="locked-h" class="display">{secret.locked.heading}</h1>
			<p class="lede">{secret.locked.lede}</p>
			<div class="progress">
				<span class="mono--micro">{secret.locked.found(app.found.length)}</span>
				<div class="bars" aria-hidden="true">
					{#each Array(TOTAL_TEST_POINTS) as _, i (i)}
						<span class="bar" class:on={i < app.found.length}></span>
					{/each}
				</div>
			</div>
			<p class="hint">{secret.locked.hint}</p>
			<a class="back mono" href={resolve('/')}>Return to the drawing</a>
		</section>
	{:else}
		<section class="open" aria-labelledby="open-h">
			<p class="mono--micro stamp">All {TOTAL_TEST_POINTS} test points traced</p>
			<h1 id="open-h" class="display">{secret.heading}</h1>
			<p class="lede">{secret.lede}</p>
			{#each secret.body as p, i (i)}
				<p class="para">{p}</p>
			{/each}
			<div class="line">
				{#if contact.email}
					<a class="mail" href="mailto:{contact.email}">{contact.email}</a>
				{:else}
					<p class="pending">
						<span class="mono--micro flag">Offline</span>
						Email is not published yet. GitHub is the open line for now.
					</p>
				{/if}
			</div>
			<p class="where mono--micro">{identity.location} · {identity.timezone}</p>
		</section>
	{/if}
</div>

<style>
	.page {
		padding: var(--s-8) 0 var(--s-9);
		max-width: 900px;
	}
	.crumb {
		margin-bottom: var(--s-6);
	}
	.crumb a {
		text-decoration: none;
		color: var(--ink-2);
	}
	.crumb a:hover {
		color: var(--accent);
	}
	.display {
		font-family: var(--font-display);
		font-size: var(--text-display);
		line-height: 0.92;
		letter-spacing: -0.03em;
		font-weight: 700;
		font-stretch: 86%;
		text-transform: uppercase;
		margin-bottom: var(--s-4);
	}
	.lede {
		font-size: clamp(1.05rem, 1.7vw, 1.3rem);
		line-height: 1.45;
		color: var(--ink-2);
		max-width: 48ch;
		margin-bottom: var(--s-5);
	}
	.para {
		font-size: 0.98rem;
		line-height: 1.66;
		max-width: 62ch;
		color: var(--ink-2);
		margin-bottom: var(--s-3);
	}
	.progress {
		border-top: var(--hair) solid var(--line-strong);
		border-bottom: var(--hair) solid var(--line-strong);
		padding: var(--s-4) 0;
		margin-bottom: var(--s-4);
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		color: var(--ink-2);
	}
	.bars {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 4px;
		max-width: 360px;
	}
	.bar {
		height: 6px;
		border: 1px solid var(--line-strong);
	}
	.bar.on {
		background: var(--accent);
		border-color: var(--accent);
	}
	.hint {
		color: var(--ink-3);
		font-size: 0.9rem;
		max-width: 56ch;
		line-height: 1.55;
		margin-bottom: var(--s-5);
	}
	.back {
		display: inline-block;
		border: var(--hair) solid var(--line-strong);
		padding: var(--s-3) var(--s-4);
		text-decoration: none;
		min-height: 44px;
	}
	.back:hover {
		background: var(--ink);
		color: var(--ground);
	}
	.stamp {
		color: var(--accent);
		border: 1px solid var(--accent);
		display: inline-block;
		padding: 3px 7px;
		margin-bottom: var(--s-4);
	}
	.line {
		border-top: var(--hair) solid var(--line-strong);
		border-bottom: var(--hair) solid var(--line-strong);
		padding: var(--s-4) 0;
		margin: var(--s-5) 0 var(--s-3);
	}
	.mail {
		font-family: var(--font-mono);
		font-size: clamp(1rem, 2.4vw, 1.4rem);
		text-decoration: none;
		border-bottom: 2px solid var(--accent);
		padding-bottom: 3px;
	}
	.mail:hover {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.pending {
		display: flex;
		gap: var(--s-3);
		align-items: baseline;
		color: var(--ink-2);
		flex-wrap: wrap;
	}
	.flag {
		border: 1px dashed var(--accent);
		color: var(--accent);
		padding: 2px 6px;
	}
	.where {
		color: var(--ink-3);
	}
</style>
