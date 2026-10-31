<script lang="ts">
	/**
	 * Level + XP + combo, in the chrome strip. Reads as a drawing's revision block: LVL, a
	 * hairline progress rule, and the current combo when one is live.
	 */
	import { game, progress, LEVEL_STEP } from '$lib/game/state.svelte';
	import { app } from '$lib/stores/app.svelte';

	const pct = $derived(Math.round(progress() * 100));
	const toNext = $derived(LEVEL_STEP - (game.xp % LEVEL_STEP));
</script>

<div class="hud mono--micro" aria-label="Progress">
	<span class="lvl">LVL <b>{game.level}</b></span>
	<span class="bar" aria-hidden="true"><span class="fill" style:width="{pct}%"></span></span>
	<span class="xp">{game.xp} XP</span>
	{#if game.combo > 1}
		<span class="combo" class:pulse={game.combo >= 5}>×{game.combo}</span>
	{/if}
	<span class="sr-only">{toNext} XP to level {game.level + 1}. {app.found.length} of 6 test points.</span>
</div>

<style>
	.hud {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 10px;
		border-left: var(--hair) solid var(--line);
		color: var(--ink-2);
	}
	.lvl b {
		color: var(--ink);
		font-weight: 700;
	}
	.bar {
		display: block;
		width: 56px;
		height: 4px;
		border: 1px solid var(--line-strong);
		background: var(--ground);
	}
	.fill {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 380ms var(--ease-draw);
	}
	.xp {
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}
	.combo {
		color: var(--accent);
		font-weight: 700;
	}
	.combo.pulse {
		animation: combo-pop 420ms var(--ease-cable);
	}
	@keyframes combo-pop {
		0% {
			transform: scale(1);
		}
		40% {
			transform: scale(1.35);
		}
		100% {
			transform: scale(1);
		}
	}
	@media (max-width: 620px) {
		.bar,
		.xp {
			display: none;
		}
		.hud {
			padding: 0 6px;
			gap: 4px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.combo.pulse {
			animation: none;
		}
	}
</style>
