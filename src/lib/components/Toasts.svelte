<script lang="ts">
	/**
	 * Achievement and level-up toasts. Polite live region, auto-dismiss, never steals focus,
	 * stacks at most three so a burst of unlocks cannot cover the page.
	 */
	import { toasts, dismiss } from '$lib/game/toasts.svelte';
</script>

<div class="stack" aria-live="polite" aria-atomic="false">
	{#each toasts.items as t (t.id)}
		<div class="toast" data-kind={t.kind}>
			<span class="mark" aria-hidden="true">{t.kind === 'level' ? '▲' : '✦'}</span>
			<span class="body">
				<span class="title">{t.title}</span>
				<span class="detail">{t.detail}</span>
			</span>
			{#if t.xp}<span class="xp mono--micro">+{t.xp}</span>{/if}
			<button class="close" onclick={() => dismiss(t.id)} aria-label="Dismiss notification">×</button>
		</div>
	{/each}
</div>

<style>
	.stack {
		position: fixed;
		right: var(--gutter);
		bottom: calc(var(--s-5) + env(safe-area-inset-bottom, 0px));
		z-index: calc(var(--z-overlay) - 1);
		display: flex;
		flex-direction: column-reverse;
		gap: 6px;
		width: min(320px, calc(100vw - 2 * var(--gutter)));
		pointer-events: none;
	}
	.toast {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		background: var(--ink);
		color: var(--ground);
		border: 1px solid var(--ink);
		padding: 10px 12px;
		pointer-events: auto;
		animation: toast-in 320ms var(--ease-cable) both;
	}
	.toast[data-kind='level'] {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--accent-ink);
	}
	.mark {
		font-size: 13px;
		line-height: 1.2;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-width: 0;
	}
	.title {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		font-weight: 700;
	}
	.detail {
		font-size: 11px;
		line-height: 1.35;
		opacity: 0.85;
	}
	.xp {
		font-family: var(--font-mono);
		font-size: 10px;
		opacity: 0.9;
		white-space: nowrap;
	}
	.close {
		background: none;
		border: 0;
		color: inherit;
		font-size: 15px;
		line-height: 1;
		padding: 2px 4px;
		min-width: 24px;
		min-height: 24px;
		opacity: 0.6;
	}
	.close:hover {
		opacity: 1;
	}
	@keyframes toast-in {
		from {
			transform: translateY(14px) scale(0.97);
			opacity: 0;
		}
		to {
			transform: none;
			opacity: 1;
		}
	}
	@media (max-width: 620px) {
		.stack {
			left: var(--gutter);
			right: var(--gutter);
			width: auto;
			bottom: calc(64px + env(safe-area-inset-bottom, 0px));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.toast {
			animation: none;
		}
	}
</style>
