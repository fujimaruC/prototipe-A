<script lang="ts">
import { stack } from '$lib/content';
</script>

<section data-reveal data-skew class="stack" id="stack" aria-labelledby="stack-h">
	<header class="head">
		<h2 data-reveal-head id="stack-h" class="display">Stack</h2>
		<p data-reveal-meta class="intro">What actually runs the rack. Grouped by where it sits, not by how impressive it sounds.</p>
	</header>
	<div class="grid">
		{#each stack as group, i (group.title)}
			<article class="group" data-frame="S0{i + 1}">
				<div class="ghead">
					<h3 class="gtitle">{group.title}</h3>
					<span class="gnum mono--micro">{String(i + 1).padStart(2, '0')}</span>
				</div>
				<p class="gnote">{group.note}</p>
				<ul>
					{#each group.items as item (item)}
						<li class="mono--micro">{item}</li>
					{/each}
				</ul>
			</article>
		{/each}
	</div>
</section>

<style>
	.stack {
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
	.grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		border-top: var(--hair) solid var(--line-strong);
		border-left: var(--hair) solid var(--line);
	}
	.group {
		padding: var(--s-4);
		border-right: var(--hair) solid var(--line);
		border-bottom: var(--hair) solid var(--line);
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
		transition: background-color var(--dur-1) var(--ease-draw);
	}
	.group:hover {
		background: var(--ground-raised);
	}
	.ghead {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.gtitle {
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.gnum {
		color: var(--accent);
	}
	.gnote {
		font-size: 0.76rem;
		color: var(--ink-3);
		line-height: 1.4;
	}
	ul {
		list-style: none;
		margin: var(--s-2) 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	li {
		color: var(--ink-2);
		letter-spacing: 0.04em;
		text-transform: none;
		font-size: 0.7rem;
		padding-bottom: 5px;
		border-bottom: 1px dashed var(--line);
	}
	li:last-child {
		border-bottom: 0;
	}
	@media (max-width: 1023px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 860px) {
		.head {
			grid-template-columns: 1fr;
			gap: var(--s-3);
		}
	}
	@media (max-width: 480px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
