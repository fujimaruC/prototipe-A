<script lang="ts">
	/**
	 * A crosshair target marking where one test point lives. It names the location, never the
	 * token: the token stays in the file or element it describes, so finding it is still the
	 * work. Keyboard-reachable, 44px target, and the hint is real text.
	 */
	import { testPointHints } from '$lib/content';
	import { app } from '$lib/stores/app.svelte';
	import { tick } from '$lib/fx/audio';

	let { id }: { id: string } = $props();

	const hint = testPointHints.find((h) => h.id === id);
	let open = $state(false);
	const found = $derived(app.found.includes(id));

	function toggle() {
		open = !open;
		if (app.sound) tick(open ? 'open' : 'tap');
	}
</script>

{#if hint}
	<div class="tp" class:found>
		<button
			class="target"
			aria-expanded={open}
			aria-controls="hint-{id}"
			aria-describedby="where-{id}"
			onclick={toggle}
		>
			<span class="cross" aria-hidden="true"></span>
			<span class="id mono--micro">{id}</span>
			<span class="state mono--micro">{found ? 'traced' : 'open'}</span>
			<span class="sr-only">, location: {hint.where}</span>
		</button>
		<p class="hint mono--micro" id="hint-{id}" hidden={!open}>{hint.hint}</p>
		<span class="sr-only" id="where-{id}">{hint.where}</span>
	</div>
{/if}

<style>
	.tp {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		gap: 4px;
		vertical-align: middle;
	}
	.target {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 10px;
		border: 1px solid var(--line);
		background: var(--ground);
		color: var(--ink-2);
		transition: border-color var(--dur-1) var(--ease-draw), color var(--dur-1) var(--ease-draw);
	}
	.target:hover,
	.target:focus-visible {
		border-color: var(--accent);
		color: var(--ink);
	}
	.cross {
		position: relative;
		width: 11px;
		height: 11px;
		flex: 0 0 11px;
	}
	.cross::before,
	.cross::after {
		content: '';
		position: absolute;
		background: currentColor;
	}
	.cross::before {
		left: 5px;
		top: 0;
		width: 1px;
		height: 11px;
	}
	.cross::after {
		top: 5px;
		left: 0;
		height: 1px;
		width: 11px;
	}
	.found .cross,
	.found .id {
		color: var(--accent);
	}
	.state {
		color: var(--ink-3);
	}
	.found .state {
		color: var(--accent);
	}
	.hint {
		max-width: 34ch;
		color: var(--ink-2);
		text-transform: none;
		letter-spacing: 0.04em;
		line-height: 1.4;
		border-left: 1px solid var(--accent);
		padding-left: 8px;
	}
</style>
