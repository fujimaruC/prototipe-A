<script lang="ts">
import { onMount } from 'svelte';
import { identity } from '$lib/content';

let clock = $state('--:--:--');
let uptime = $state('00:00');
let coords = $state('—');
let scrollPct = $state('0');
let viewport = $state('—');

onMount(() => {
	const t0 = Date.now();
	const fmtTime = new Intl.DateTimeFormat('en-GB', {
		timeZone: identity.timezone,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});
	const pad = (n: number) => String(n).padStart(2, '0');

	const tick = () => {
		clock = fmtTime.format(new Date());
		const s = Math.floor((Date.now() - t0) / 1000);
		uptime = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		scrollPct = String(max > 0 ? Math.round((window.scrollY / max) * 100) : 0);
		viewport = `${window.innerWidth}×${window.innerHeight}`;
	};
	tick();
	const id = window.setInterval(tick, 1000);

	const onMove = (e: PointerEvent) => {
		coords = `${String(Math.round(e.clientX)).padStart(4, '0')} ${String(Math.round(e.clientY)).padStart(4, '0')}`;
	};
	window.addEventListener('pointermove', onMove, { passive: true });
	return () => {
		window.clearInterval(id);
		window.removeEventListener('pointermove', onMove);
	};
});
</script>

<div class="telemetry mono--micro" aria-label="Live readouts" role="status">
	<span class="cell"><span class="k">LOCAL</span> {clock}</span>
	<span class="cell"><span class="k">TZ</span> {identity.timezone}</span>
	<span class="cell hide-sm"><span class="k">XY</span> {coords}</span>
	<span class="cell"><span class="k">SCR</span> {scrollPct}%</span>
	<span class="cell hide-md"><span class="k">UP</span> {uptime}</span>
	<span class="cell hide-md"><span class="k">VP</span> {viewport}</span>
</div>

<style>
	.telemetry {
		display: flex;
		flex-wrap: wrap;
		gap: 0;
		border: var(--hair) solid var(--line);
		background: var(--ground);
	}
	.cell {
		padding: 4px 8px;
		border-right: var(--hair) solid var(--line);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		color: var(--ink-2);
	}
	.cell:last-child {
		border-right: 0;
	}
	.k {
		color: var(--ink-3);
		margin-right: 4px;
	}
	@media (max-width: 860px) {
		.hide-md {
			display: none;
		}
	}
	@media (max-width: 620px) {
		.hide-sm {
			display: none;
		}
	}
</style>
