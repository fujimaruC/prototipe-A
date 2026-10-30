<script lang="ts">
import { certs, record } from '$lib/content';
</script>

<section class="record" id="record" aria-labelledby="record-h">
	<header class="head">
		<h2 id="record-h" class="display">Record</h2>
		<p class="intro">Competition results and certifications. Results are listed as they stand, including the one that is still pending.</p>
	</header>

	<table class="sheet">
		<caption class="sr-only">Competition results by event, scope, year and result</caption>
		<thead>
			<tr>
				<th scope="col" class="mono--micro">Event</th>
				<th scope="col" class="mono--micro">Scope</th>
				<th scope="col" class="mono--micro">Year</th>
				<th scope="col" class="mono--micro">Result</th>
			</tr>
		</thead>
		<tbody>
			{#each record as row (row.event + row.year + row.scope)}
				<tr>
					<th scope="row">
						<span class="ev">{row.event}</span>
						<span class="detail">{row.detail}</span>
					</th>
					<td class="scope">{row.scope}</td>
					<td class="year mono--micro">{row.year}</td>
					<td class="res" class:pending={row.result === 'Qualified'}>
						<span class="mono--micro">{row.result}</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="certs">
		<h3 class="mono sub">Certifications</h3>
		<ul>
			{#each certs as c (c.name)}
				<li>
					<span class="cname">{c.name}</span>
					<span class="issuer">{c.issuer}</span>
					<span class="cyear mono--micro">{c.year}</span>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.record {
		padding: var(--s-8) 0;
		border-bottom: var(--hair) solid var(--line-strong);
	}
	.head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
		gap: var(--s-6);
		align-items: end;
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
	.intro {
		font-size: 0.95rem;
		line-height: 1.55;
		color: var(--ink-2);
		max-width: 42ch;
	}
	.sheet {
		width: 100%;
		border-collapse: collapse;
		border-top: var(--hair) solid var(--line-strong);
	}
	th,
	td {
		text-align: left;
		padding: var(--s-3) var(--s-3) var(--s-3) 0;
		border-bottom: var(--hair) solid var(--line);
		vertical-align: baseline;
	}
	thead th {
		color: var(--ink-3);
		font-weight: 400;
	}
	tbody th {
		font-weight: 400;
	}
	.ev {
		display: block;
		font-size: 1.02rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.detail {
		display: block;
		font-size: 0.78rem;
		color: var(--ink-3);
		margin-top: 2px;
	}
	.scope {
		color: var(--ink-2);
		font-size: 0.9rem;
	}
	.year {
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}
	.res .mono--micro {
		display: inline-block;
		white-space: nowrap;
		border: var(--hair) solid var(--accent);
		color: var(--accent);
		padding: 3px 7px;
		letter-spacing: 0.1em;
	}
	.res.pending .mono--micro {
		border-style: dashed;
		color: var(--ink-2);
		border-color: var(--line-strong);
	}
	.certs {
		margin-top: var(--s-7);
	}
	.sub {
		color: var(--ink-3);
		margin-bottom: var(--s-3);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0 var(--s-6);
	}
	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0 var(--s-3);
		padding: var(--s-3) 0;
		border-top: var(--hair) solid var(--line);
		align-items: baseline;
	}
	.cname {
		font-weight: 600;
		font-size: 0.95rem;
	}
	.issuer {
		grid-column: 1;
		font-size: 0.8rem;
		color: var(--ink-3);
	}
	.cyear {
		grid-row: 1 / span 2;
		grid-column: 2;
		color: var(--ink-3);
	}
	@media (max-width: 860px) {
		.head {
			grid-template-columns: 1fr;
			gap: var(--s-3);
		}
		ul {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 620px) {
		thead {
			display: none;
		}
		tr {
			display: grid;
			grid-template-columns: 1fr auto;
			gap: var(--s-2);
			padding: var(--s-4) 0;
		}
		th,
		td {
			border: 0;
			padding: 0;
		}
		.scope {
			grid-column: 1 / -1;
		}
		.res {
			grid-row: 1;
			grid-column: 2;
		}
		.year {
			grid-column: 2;
			text-align: right;
		}
	}
</style>
