<script lang="ts">
import { ports } from '$lib/content';
import { tick as sfx } from '$lib/fx/audio';
import { prefersReducedMotion } from '$lib/fx/env';
import { playRing } from '$lib/fx/ring';
import { app } from '$lib/stores/app.svelte';

let { active = '' }: { active?: string } = $props();

const ids = ['profile', 'cases', 'record', 'stack', 'contact'];

function go(id: string, e: MouseEvent) {
	e.preventDefault();
	const el = document.getElementById(id);
	if (!el) return;

	// The ring opens from the tab you pressed, so the transition has a physical origin.
	if (!prefersReducedMotion()) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const cs = getComputedStyle(document.documentElement);
		void playRing({
			x: r.left + r.width / 2,
			y: r.top + r.height / 2,
			ground: cs.getPropertyValue('--ground').trim() || '#ececec',
			accent: cs.getPropertyValue('--accent').trim() || '#a34817',
			duration: 560
		});
	}

	el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
	el.setAttribute('tabindex', '-1');
	el.focus({ preventScroll: true });
}
</script>

<nav class="rail" aria-label="Sections">
	<ul>
		{#each ports as port, i (port.id)}
			{@const id = ids[i] ?? ''}
			<li>
				<a
					href="#{id}"
					class:current={active === id}
					data-frame={port.id}
					onmouseenter={() => app.sound && sfx('hover')}
					onclick={(e) => go(id, e)}
				>
					<span class="idx mono--micro">{port.id}</span>
					<span class="lbl mono">{port.label}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.rail {
		width: var(--rail);
		flex: 0 0 var(--rail);
		border-right: var(--hair) solid var(--line-strong);
		position: sticky;
		top: 0;
		height: 100dvh;
		display: flex;
		align-items: center;
		z-index: var(--z-tabs);
		background: var(--ground);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
	}
	li + li {
		border-top: var(--hair) solid var(--line);
	}
	a {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-2);
		padding: var(--s-4) 0;
		text-decoration: none;
		color: var(--ink-2);
		transition: color var(--dur-1) var(--ease-draw), background-color var(--dur-1) var(--ease-draw);
	}
	.lbl {
		writing-mode: vertical-rl;
		transform: rotate(180deg);
		letter-spacing: 0.22em;
	}
	.idx {
		color: var(--ink-3);
		transition: color var(--dur-1) var(--ease-draw);
	}
	a:hover {
		color: var(--ink);
		background: var(--ground-raised);
	}
	a:hover .lbl {
		letter-spacing: 0.26em;
	}
	a.current {
		color: var(--accent);
		background: var(--ground-raised);
	}
	a.current .idx {
		color: var(--ink);
	}
	@media (max-width: 767px) {
		.rail {
			width: auto;
			max-width: 100%;
			flex: none;
			height: auto;
			position: sticky;
			top: 0;
			border-right: 0;
			border-bottom: var(--hair) solid var(--line-strong);
			overflow-x: auto;
			scrollbar-width: none;
		}
		.rail::-webkit-scrollbar {
			display: none;
		}
		ul {
			display: flex;
			width: max-content;
		}
		li + li {
			border-top: 0;
			border-left: var(--hair) solid var(--line);
		}
		a {
			flex-direction: row;
			padding: var(--s-3) var(--s-4);
			min-height: 44px;
		}
		.lbl {
			writing-mode: horizontal-tb;
			transform: none;
			letter-spacing: 0.14em;
			white-space: nowrap;
		}
	}
</style>
