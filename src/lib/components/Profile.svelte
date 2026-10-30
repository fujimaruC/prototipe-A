<script lang="ts">
import { about } from '$lib/content';
import TestMarker from '$lib/components/TestMarker.svelte';
</script>

<section data-reveal class="profile" id="profile" aria-labelledby="profile-h">
	<header class="head">
		<h2 data-reveal-head data-skew data-platform id="profile-h" class="display">{about.heading}</h2>
		<TestMarker id="TP-01" />
	</header>
	<div class="cols">
		<div class="prose">
			<p data-reveal-meta class="lede">{about.lede}</p>
			{#each about.paragraphs as p, i (i)}
				<p class="para">{p}</p>
			{/each}
		</div>
		<table class="matrix">
			<caption class="sr-only">Skill matrix: area, usage level, and detail</caption>
			<thead>
				<tr>
					<th scope="col" class="mono--micro">Area</th>
					<th scope="col" class="mono--micro">Use</th>
					<th scope="col" class="mono--micro">Detail</th>
				</tr>
			</thead>
			<tbody>
				{#each about.matrix as row (row.area)}
					<tr>
						<th scope="row">{row.area}</th>
						<td class="mono--micro lvl">{row.level}</td>
						<td class="note">{row.note}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	.profile {
		padding: var(--s-8) 0;
		border-bottom: var(--hair) solid var(--line-strong);
	}
	.head {
		margin-bottom: var(--s-6);
	}
	.display {
		font-family: var(--font-display);
		font-size: var(--text-display);
		line-height: 0.92;
		letter-spacing: -0.03em;
		font-weight: 700;
		font-stretch: 88%;
		text-transform: uppercase;
	}
	.cols {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		gap: clamp(24px, 4vw, 64px);
		align-items: start;
	}
	.lede {
		font-size: clamp(1.1rem, 1.7vw, 1.35rem);
		line-height: 1.45;
		letter-spacing: -0.01em;
		max-width: 46ch;
		margin-bottom: var(--s-5);
	}
	.para {
		font-size: 0.97rem;
		line-height: 1.66;
		color: var(--ink-2);
		max-width: 58ch;
	}
	.para + .para {
		margin-top: var(--s-3);
	}
	.matrix {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}
	th,
	td {
		text-align: left;
		padding: var(--s-3) var(--s-2);
		border-bottom: var(--hair) solid var(--line);
		vertical-align: top;
	}
	thead th {
		color: var(--ink-3);
		border-bottom-color: var(--line-strong);
		font-weight: 400;
	}
	tbody th {
		font-weight: 600;
		white-space: nowrap;
	}
	.lvl {
		color: var(--accent);
		white-space: nowrap;
	}
	.note {
		color: var(--ink-2);
		font-size: 0.84rem;
		line-height: 1.45;
	}
	@media (max-width: 900px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 520px) {
		thead {
			display: none;
		}
		tr {
			display: grid;
			grid-template-columns: 1fr auto;
			border-bottom: var(--hair) solid var(--line);
			padding: var(--s-3) 0;
		}
		th,
		td {
			border: 0;
			padding: 0;
		}
		.note {
			grid-column: 1 / -1;
			margin-top: var(--s-1);
		}
	}
</style>
