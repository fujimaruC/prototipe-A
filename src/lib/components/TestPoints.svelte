<script lang="ts">
import type { SubmitResult } from '$lib/flags';
import { submit, TOTAL_TEST_POINTS } from '$lib/flags';
import { tick } from '$lib/fx/audio';
import { addFound, app } from '$lib/stores/app.svelte';

let value = $state('');
let status = $state<'idle' | 'checking' | 'found' | 'duplicate' | 'invalid' | 'unavailable'>('idle');
let message = $state('');
let input: HTMLInputElement | undefined = $state();
let live = $state('');

async function onSubmit(e: SubmitEvent) {
	e.preventDefault();
	status = 'checking';
	message = '';
	const result: SubmitResult = await submit(value, app.found);
	if (result.kind === 'found') {
		status = 'found';
		addFound(result.id);
		message = `${result.id} traced. ${app.found.length} of ${TOTAL_TEST_POINTS} found.`;
		live = message;
		value = '';
		if (app.sound) tick('found');
		if (app.found.length >= TOTAL_TEST_POINTS) {
			window.setTimeout(() => (window.location.href = '/secret'), 700);
		}
	} else if (result.kind === 'duplicate') {
		status = 'duplicate';
		message = `${result.id} is already traced.`;
		live = message;
	} else if (result.kind === 'unavailable') {
		status = 'unavailable';
		message = 'This browser has no Web Crypto, so verification cannot run here.';
		live = message;
	} else {
		status = 'invalid';
		message = 'That token does not match any test point.';
		live = message;
		input?.focus();
	}
}

const progress = $derived(app.found.length);
</script>

<section class="tp" aria-labelledby="tp-h" data-frame="TP">
	<div class="tp-head">
		<h2 id="tp-h" class="mono">Test points</h2>
		<p class="count mono--micro">
			<span aria-hidden="true">{progress}/{TOTAL_TEST_POINTS}</span>
			<span class="sr-only">{progress} of {TOTAL_TEST_POINTS} test points traced</span>
		</p>
	</div>
	<p class="copy">
		Six test points are marked on this drawing. Each one is a short token; trace one and it is
		recorded here. Find all six and the restricted sheet opens.
	</p>

	<div class="bars" aria-hidden="true">
		{#each Array(TOTAL_TEST_POINTS) as _, i (i)}
			<span class="bar" class:on={i < progress}></span>
		{/each}
	</div>

	{#if progress > 0}
		<ul class="found" aria-label="Traced test points">
			{#each app.found as id (id)}
				<li class="chip mono--micro">{id}</li>
			{/each}
		</ul>
	{/if}

	<form onsubmit={onSubmit} class="form">
		<label class="mono--micro" for="tp-input">Token</label>
		<div class="row">
			<input
				id="tp-input"
				bind:this={input}
				bind:value
				type="text"
				placeholder="Paste a token"
				autocomplete="off"
				spellcheck="false"
				aria-describedby="tp-msg"
				aria-invalid={status === 'invalid'}
			/>
			<button type="submit" class="mono--micro" disabled={status === 'checking'}>
				{status === 'checking' ? 'Checking' : 'Trace'}
			</button>
		</div>
		<p id="tp-msg" class="msg mono--micro" data-state={status}>{message}</p>
		<p class="sr-only" aria-live="polite">{live}</p>
	</form>

	{#if progress >= TOTAL_TEST_POINTS}
		<a class="unlock mono" href="/secret">Open restricted sheet →</a>
	{/if}
</section>

<style>
	.tp {
		border: var(--hair) solid var(--line-strong);
		background: var(--ground-sunk);
		padding: var(--s-4);
	}
	.tp-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		border-bottom: var(--hair) solid var(--line);
		padding-bottom: var(--s-2);
		margin-bottom: var(--s-3);
	}
	.tp-head h2 {
		color: var(--accent);
	}
	.count {
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.copy {
		font-size: 0.86rem;
		line-height: 1.55;
		color: var(--ink-2);
		max-width: 42ch;
		margin-bottom: var(--s-3);
	}
	.bars {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 3px;
		margin-bottom: var(--s-4);
	}
	.bar {
		height: 6px;
		border: 1px solid var(--line-strong);
		background: transparent;
	}
	.bar.on {
		background: var(--accent);
		border-color: var(--accent);
	}
	.found {
		list-style: none;
		margin: 0 0 var(--s-3);
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-2);
	}
	.chip {
		border: 1px solid var(--accent);
		color: var(--accent);
		padding: 6px 8px;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.form label {
		color: var(--ink-3);
	}
	.row {
		display: flex;
		gap: 0;
	}
	input {
		flex: 1;
		min-width: 0;
		min-height: 44px;
		border: var(--hair) solid var(--line-strong);
		border-right: 0;
		background: var(--ground);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.85rem;
		padding: 0 var(--s-3);
	}
	input::placeholder {
		color: var(--ink-3);
	}
	button[type='submit'] {
		min-height: 44px;
		min-width: 88px;
		border: var(--hair) solid var(--line-strong);
		background: var(--ink);
		color: var(--ground);
		letter-spacing: 0.14em;
	}
	button[type='submit']:hover:not(:disabled) {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}
	button[type='submit']:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.msg {
		min-height: 1.2em;
		color: var(--ink-3);
		text-transform: none;
		letter-spacing: 0.04em;
	}
	.msg[data-state='found'] {
		color: var(--accent);
	}
	.msg[data-state='invalid'] {
		color: var(--alert);
	}
	.unlock {
		display: inline-block;
		margin-top: var(--s-4);
		color: var(--accent);
		text-decoration: none;
		border-bottom: 1px solid var(--accent);
		padding-bottom: 2px;
	}
	.unlock:hover {
		background: var(--accent);
		color: var(--accent-ink);
	}
</style>
