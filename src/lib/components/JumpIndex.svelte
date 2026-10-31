<script lang="ts">
import { ports } from '$lib/content';
import { app } from '$lib/stores/app.svelte';
import { playRing } from '$lib/fx/ring';
import { prefersReducedMotion } from '$lib/fx/env';
import { unlock } from '$lib/game/state.svelte';
import { pushAchievement } from '$lib/game/toasts.svelte';

const ids = ['profile', 'cases', 'record', 'stack', 'contact'];
const entries = ports.map((p, i) => ({ ...p, id: ids[i] ?? '' }));

let query = $state('');
let selected = $state(0);
let input: HTMLInputElement | undefined = $state();
let dialog: HTMLDivElement | undefined = $state();
let returnTo: HTMLElement | null = null;

const filtered = $derived(
	entries.filter((e) => (e.label + e.value + e.detail).toLowerCase().includes(query.toLowerCase())),
);

$effect(() => {
	if (!app.indexOpen) return;
	selected = 0;
	returnTo = document.activeElement as HTMLElement | null;
	queueMicrotask(() => input?.focus());

	// Escape must work wherever focus lands — a filtered list can remove the focused node
	// and drop focus to <body>, which is outside the dialog's keydown handler.
	const onEsc = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		}
	};
	window.addEventListener('keydown', onEsc);
	return () => window.removeEventListener('keydown', onEsc);
});

function close() {
	app.indexOpen = false;
	const target = returnTo;
	returnTo = null;
	queueMicrotask(() => target?.focus?.());
}
function choose(id: string, origin?: { x: number; y: number }) {
	close();
	const el = document.getElementById(id);
	if (!el) return;

	// The ring opens from the row you picked, so the transition has a physical origin.
	if (!prefersReducedMotion() && origin) {
		const cs = getComputedStyle(document.documentElement);
		void playRing({
			x: origin.x,
			y: origin.y,
			ground: cs.getPropertyValue('--ground').trim() || '#ececec',
			accent: cs.getPropertyValue('--accent').trim() || '#a34817',
			duration: 560,
		});
	}

	el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
	el.setAttribute('tabindex', '-1');
	el.focus({ preventScroll: true });
}
function summonCharacter() {
	close();
	// Only award the badge when a character actually exists to summon: otherwise the summon is
	// a no-op (reduced motion, or no character on this viewport) and the badge would be a lie.
	if (!window.__fujimaru) return;
	window.__fujimaru.summon();
	const u = unlock('fujimaru');
	if (u) pushAchievement(u.achievement, u.levelUp);
}

function onKey(e: KeyboardEvent) {
	if (e.key === 'ArrowDown') {
		e.preventDefault();
		selected = Math.min(filtered.length - 1, selected + 1);
	}
	if (e.key === 'ArrowUp') {
		e.preventDefault();
		selected = Math.max(0, selected - 1);
	}
	if (e.key === 'Enter') {
		e.preventDefault();
		const target = filtered[selected];
		if (target) choose(target.id);
	}
	if (e.key === 'Tab') {
		const nodes = dialog?.querySelectorAll<HTMLElement>('input, button');
		if (!nodes || nodes.length === 0) return;
		const first = nodes[0];
		const last = nodes[nodes.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last?.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first?.focus();
		}
	}
}
</script>

{#if app.indexOpen}
	<div class="scrim" role="presentation" onclick={close}></div>
	<div
		class="panel"
		bind:this={dialog}
		role="dialog"
		tabindex="-1"
		aria-modal="true"
		aria-labelledby="index-h"
		onkeydown={onKey}
	>
		<div class="head">
			<h2 id="index-h" class="mono">Sheet index</h2>
			<button class="mono--micro close" onclick={close} aria-label="Close index">Esc</button>
		</div>
		<label class="field">
			<span class="sr-only">Filter sections</span>
			<input
				bind:this={input}
				bind:value={query}
				type="search"
				placeholder="Filter ports…"
				autocomplete="off"
				spellcheck="false"
			/>
		</label>
		<button class="summon mono--micro" onclick={summonCharacter}>
			<span>↳</span> summon fujimaru
		</button>
		<ul class="list" role="listbox" aria-label="Sections" tabindex="-1">
			{#each filtered as e, i (e.id)}
				<li role="option" aria-selected={i === selected}>
					<button
						onclick={(ev) => {
							const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
							choose(e.id, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
						}}
						onpointerenter={() => (selected = i)}
					>
						<span class="pid mono--micro">{e.id}</span>
						<span class="plabel">{e.label}</span>
						<span class="pdetail mono--micro">{e.detail}</span>
					</button>
				</li>
			{:else}
				<li class="empty">
					<p>No port matches “{query}”.</p>
					<button class="mono--micro reset" onclick={() => (query = '')}>Clear filter</button>
				</li>
			{/each}
		</ul>
		<p class="hint mono--micro">↑ ↓ move · Enter open · Esc close</p>
	</div>
{/if}

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: color-mix(in srgb, var(--ground) 72%, transparent);
		backdrop-filter: blur(2px);
	}
	.panel {
		position: fixed;
		z-index: calc(var(--z-overlay) + 1);
		top: 12vh;
		left: 50%;
		transform: translateX(-50%);
		width: min(560px, calc(100vw - 32px));
		background: var(--ground);
		border: var(--hair) solid var(--line-strong);
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--s-3) var(--s-4);
		border-bottom: var(--hair) solid var(--line-strong);
	}
	.head h2 {
		color: var(--accent);
	}
	.close {
		min-height: 32px;
		padding: 0 var(--s-2);
		border: var(--hair) solid var(--line);
		color: var(--ink-2);
	}
	.close:hover {
		background: var(--ink);
		color: var(--ground);
	}
	.field {
		display: block;
		border-bottom: var(--hair) solid var(--line);
	}
	.field input {
		width: 100%;
		border: 0;
		background: var(--ground-raised);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.95rem;
		padding: var(--s-4);
		min-height: 48px;
	}
	.field input::placeholder {
		color: var(--ink-3);
	}
	.field input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.summon {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		width: 100%;
		min-height: 44px;
		padding: 0 var(--s-4);
		border-bottom: var(--hair) solid var(--line);
		color: var(--accent);
		text-align: left;
	}
	.summon:hover {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		max-height: 46vh;
		overflow-y: auto;
	}
	.list button {
		display: grid;
		grid-template-columns: 52px minmax(0, 1fr) auto;
		gap: var(--s-3);
		width: 100%;
		text-align: left;
		align-items: baseline;
		min-height: 48px;
		padding: var(--s-3) var(--s-4);
		border-bottom: var(--hair) solid var(--line);
	}
	li[aria-selected='true'] button {
		background: var(--accent);
		color: var(--accent-ink);
	}
	li[aria-selected='true'] .pid,
	li[aria-selected='true'] .pdetail {
		color: var(--accent-ink);
	}
	.pid {
		color: var(--accent);
	}
	.plabel {
		font-size: 1rem;
		font-weight: 600;
	}
	.pdetail {
		color: var(--ink-3);
		text-transform: none;
		letter-spacing: 0.04em;
	}
	.empty {
		padding: var(--s-5) var(--s-4);
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
		align-items: flex-start;
		color: var(--ink-2);
	}
	.reset {
		border: var(--hair) solid var(--line-strong);
		padding: var(--s-2) var(--s-3);
		min-height: 44px;
	}
	.hint {
		padding: var(--s-3) var(--s-4);
		color: var(--ink-3);
		border-top: var(--hair) solid var(--line);
	}
	@media (max-width: 520px) {
		.panel {
			top: 8vh;
		}
		.list button {
			grid-template-columns: 44px minmax(0, 1fr);
		}
		.pdetail {
			display: none;
		}
	}
</style>
