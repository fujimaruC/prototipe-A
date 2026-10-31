<script lang="ts">
	/**
	 * Phone-only action dock. The desktop chrome has room for mode/sound/index; a phone does
	 * not, so the dock carries the primary actions plus the game state. Touch targets are 48px.
	 */
	import { app, toggleMode } from '$lib/stores/app.svelte';
	import { game, progress, unlock } from '$lib/game/state.svelte';
import { pushAchievement } from '$lib/game/toasts.svelte';
	import { tick as sfx } from '$lib/fx/audio';
	import { resolve } from '$app/paths';

	const pct = $derived(Math.round(progress() * 100));

	function mode() {
		toggleMode();
		const u = unlock('invert');
		if (u) pushAchievement(u.achievement, u.levelUp);
		if (app.sound) sfx('tap');
	}
	function sound() {
		app.sound = !app.sound;
		if (app.sound) sfx('tap');
	}
	function index() {
		app.indexOpen = true;
		const u = unlock('index');
		if (u) pushAchievement(u.achievement, u.levelUp);
		if (app.sound) sfx('open');
	}
</script>

<nav class="dock" aria-label="Quick actions">
	<button class="act" onclick={index}>
		<span class="ico" aria-hidden="true">⌗</span>
		<span class="lbl mono--micro">Index</span>
		<span class="sr-only">, open the section list</span>
	</button>
	<button class="act" onclick={mode} aria-pressed={app.mode === 'negative'}>
		<span class="ico" aria-hidden="true">{app.mode === 'negative' ? '◼' : '◻'}</span>
		<span class="lbl mono--micro">{app.mode === 'negative' ? 'Neg' : 'Pos'}</span>
		<span class="sr-only">, negative mode</span>
	</button>
	<button class="act" onclick={sound} aria-pressed={app.sound}>
		<span class="ico" aria-hidden="true">{app.sound ? '♪' : '∅'}</span>
		<span class="lbl mono--micro">Sound</span>
		<span class="sr-only">, {app.sound ? 'on' : 'off'}</span>
	</button>
	<a class="act" href={resolve('/secret')}>
		<span class="ico" aria-hidden="true">⚿</span>
		<span class="lbl mono--micro">Secret</span>
		<span class="sr-only">, restricted sheet</span>
	</a>
	<span class="level" aria-label="Level {game.level}, {pct}% to next">
		<span class="lv mono--micro">LV {game.level}</span>
		<span class="ring" aria-hidden="true">
			<span class="fill" style:height="{pct}%"></span>
		</span>
	</span>
</nav>

<style>
	.dock {
		display: none;
	}
	@media (max-width: 767px) {
		.dock {
			display: grid;
			grid-template-columns: repeat(4, 1fr) auto;
			align-items: stretch;
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: var(--z-tabs);
			background: var(--ground);
			border-top: var(--hair) solid var(--line-strong);
			padding-bottom: env(safe-area-inset-bottom, 0px);
		}
	}
	.act {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 48px;
		padding: 6px 4px;
		text-decoration: none;
		color: var(--ink-2);
		border-right: var(--hair) solid var(--line);
		background: var(--ground);
		transition: background-color 120ms var(--ease-draw), color 120ms var(--ease-draw);
	}
	.act:active,
	.act[aria-pressed='true'] {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.ico {
		font-size: 15px;
		line-height: 1;
	}
	.lbl {
		font-size: 9px;
		letter-spacing: 0.08em;
	}
	.level {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 10px;
		border-left: var(--hair) solid var(--line);
	}
	.lv {
		color: var(--accent);
		font-weight: 700;
	}
	.ring {
		position: relative;
		display: block;
		width: 6px;
		height: 26px;
		border: 1px solid var(--line-strong);
		overflow: hidden;
	}
	.fill {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--accent);
		transition: height 380ms var(--ease-draw);
	}
	@media (prefers-reduced-motion: reduce) {
		.act,
		.fill {
			transition: none;
		}
	}
</style>
