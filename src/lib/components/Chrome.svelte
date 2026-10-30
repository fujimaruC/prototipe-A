<script lang="ts">
import { identity } from '$lib/content';
import { tick } from '$lib/fx/audio';
import { app, toggleMode } from '$lib/stores/app.svelte';
import Telemetry from './Telemetry.svelte';

function onMode() {
	toggleMode();
	if (app.sound) tick('tap');
}
function onSound() {
	app.sound = !app.sound;
	if (app.sound) tick('tap');
}
function onIndex() {
	app.indexOpen = true;
	if (app.sound) tick('open');
}
</script>

<header class="chrome">
	<div class="brand">
		<span class="mono--micro mark">N-EX</span>
		<span class="mono--micro sep">/</span>
		<span class="mono--micro">DRAWING 01</span>
	</div>

	<Telemetry />

	<div class="controls">
		<button
			class="ctl mono--micro"
			onclick={onMode}
			aria-pressed={app.mode === 'negative'}
			title="Toggle negative mode"
		>
			<span class="swatch" class:on={app.mode === 'negative'} aria-hidden="true"></span>
			{app.mode === 'negative' ? 'Negative' : 'Positive'}
		</button>
		<button
			class="ctl mono--micro"
			onclick={onSound}
			aria-pressed={app.sound}
			title="Toggle interface ticks"
		>
			Sound {app.sound ? 'on' : 'off'}
		</button>
		<button class="ctl mono--micro" onclick={onIndex} title="Jump to a section ( / )">
			Index <kbd>/</kbd>
		</button>
	</div>
</header>
<span class="sr-only">{identity.first} {identity.last}, {identity.role}</span>

<style>
	.chrome {
		display: flex;
		align-items: stretch;
		justify-content: space-between;
		gap: var(--s-4);
		border-bottom: var(--hair) solid var(--line-strong);
		padding: var(--s-2) 0;
		flex-wrap: wrap;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: var(--s-2);
		padding-right: var(--s-4);
		color: var(--ink-2);
	}
	.mark {
		color: var(--accent);
	}
	.sep {
		color: var(--ink-3);
	}
	.controls {
		display: flex;
		align-items: stretch;
		gap: 0;
		border: var(--hair) solid var(--line);
	}
	.ctl {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 32px;
		padding: 0 var(--s-3);
		color: var(--ink-2);
		border-right: var(--hair) solid var(--line);
		white-space: nowrap;
		transition: background-color var(--dur-1) var(--ease-draw), color var(--dur-1) var(--ease-draw);
	}
	.ctl:last-child {
		border-right: 0;
	}
	.ctl:hover {
		background: var(--ground-raised);
		color: var(--ink);
	}
	.ctl[aria-pressed='true'] {
		color: var(--accent);
	}
	.swatch {
		width: 8px;
		height: 8px;
		border: 1px solid var(--ink);
		background: var(--ground);
	}
	.swatch.on {
		background: var(--ink);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		border: 1px solid var(--line);
		padding: 0 3px;
		color: var(--ink-3);
	}
	@media (max-width: 900px) {
		.chrome {
			gap: var(--s-2);
		}
		.brand {
			order: 1;
		}
		.controls {
			order: 2;
			flex: 1;
			justify-content: flex-end;
		}
		:global(.telemetry) {
			order: 3;
			width: 100%;
		}
		.ctl {
			min-height: 44px;
		}
	}
</style>
