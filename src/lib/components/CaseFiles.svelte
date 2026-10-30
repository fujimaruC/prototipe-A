<script lang="ts">
import { animate, stagger } from 'motion';
import type { CaseFile } from '$lib/content';
import { caseFiles } from '$lib/content';
import { prefersReducedMotion } from '$lib/fx/env';
import TestMarker from '$lib/components/TestMarker.svelte';

let open = $state<string | null>(null);
const panels = new Map<string, HTMLDivElement>();

function register(node: HTMLDivElement, id: string) {
	panels.set(id, node);
	return {
		destroy() {
			panels.delete(id);
		},
	};
}

/**
 * Motion drives the one state change that has real physics in it: a panel unfolding.
 * Springs are interruptible, so a fast second click reverses from the current height
 * instead of snapping to the CSS end state.
 */
async function toggle(id: string) {
	const next = open === id ? null : id;
	const previous = open;
	open = next;
	if (prefersReducedMotion()) return;

	if (previous && previous !== next) {
		const prev = panels.get(previous);
		if (prev)
			await animate(prev, { height: ['auto', '0px'] }, { duration: 0.22, ease: [0.55, 0.06, 0.68, 0.19] });
		if (prev) prev.style.height = '';
	}
	const el = panels.get(id);
	if (!el) return;
	if (next) {
		await animate(
			el,
			{ height: ['0px', 'auto'] },
			{ type: 'spring', stiffness: 320, damping: 34, mass: 0.9 },
		);
		el.style.height = 'auto';
		const rows = el.querySelectorAll('.body, .summary-text, .ext');
		animate(
			rows,
			{ opacity: [0, 1], y: [6, 0] },
			{ delay: stagger(0.026), duration: 0.3, ease: [0.22, 0.61, 0.36, 1] },
		);
	} else {
		await animate(el, { height: ['auto', '0px'] }, { duration: 0.22, ease: [0.55, 0.06, 0.68, 0.19] });
		el.style.height = '';
	}
}
const statusLabel: Record<CaseFile['status'], string> = {
	documented: 'Documented',
	'in-progress': 'In progress',
	draft: 'Draft',
};
</script>

<section data-reveal class="cases" id="cases" aria-labelledby="cases-h">
	<header class="head">
		<h2 data-reveal-head data-skew data-platform id="cases-h" class="display">Case files</h2>
		<TestMarker id="TP-02" />
		<p data-reveal-meta class="intro">
			Work on the record. One entry is written up; the rest are marked as drafts until the build notes are
			in. Nothing here is scored for effect.
		</p>
	</header>

	<div class="board" role="list">
		{#each caseFiles as file, i (file.id)}
			{@const isOpen = open === file.id}
			<div class="row" class:open={isOpen} role="listitem" data-platform data-frame={file.id}>
				<button
					class="summary"
					aria-expanded={isOpen}
					aria-controls="panel-{file.id}"
					onclick={() => toggle(file.id)}
				>
					<span class="id mono--micro">{file.id}</span>
					<span class="cat mono--micro">{file.category}</span>
					<span class="title">{file.title}</span>
					<span class="year mono--micro">{file.year}</span>
					<span class="status mono--micro s-{file.status}">{file.placeholder ? 'Slot open' : statusLabel[file.status]}</span>
					<span class="sign" aria-hidden="true">{isOpen ? '−' : '+'}</span>
				</button>
				<div
					class="panel"
					id="panel-{file.id}"
					inert={!isOpen}
					use:register={file.id}
				>
					<div class="panel-inner" class:redacted={file.placeholder}>
						{#if file.placeholder}
							<p class="stamp mono--micro" aria-hidden="true">REDACTED</p>
						{/if}
						<p class="summary-text">{file.summary}</p>
						{#each file.body as para, k (k)}
							<p class="body" class:todo={file.placeholder}>{para}</p>
						{/each}
						{#if file.link}
							<a class="ext mono" href={file.link.href} rel="me noopener noreferrer" target="_blank">
								{file.link.label} ↗
							</a>
						{/if}
					</div>
				</div>
				<span class="index mono--micro" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
			</div>
		{/each}
	</div>
</section>

<style>
	.cases {
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
		max-width: 40ch;
	}
	.board {
		border-top: var(--hair) solid var(--line-strong);
	}
	.row {
		position: relative;
		border-bottom: var(--hair) solid var(--line);
	}
	.summary {
		display: grid;
		grid-template-columns: 64px 56px minmax(0, 1fr) 56px 104px 28px;
		gap: var(--s-3);
		align-items: center;
		width: 100%;
		min-height: 56px;
		padding: var(--s-3) var(--s-2) var(--s-3) 0;
		text-align: left;
		color: var(--ink);
	}
	.id {
		color: var(--ink-3);
	}
	.cat {
		color: var(--accent);
	}
	.title {
		font-size: var(--text-title);
		letter-spacing: -0.01em;
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.year {
		color: var(--ink-3);
	}
	.status {
		color: var(--ink-2);
	}
	.s-documented {
		color: var(--accent);
	}
	.s-draft {
		color: var(--ink-3);
	}
	.sign {
		font-family: var(--font-mono);
		font-size: 1rem;
		color: var(--ink-2);
		text-align: right;
	}
	.row:hover .title {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 4px;
	}
	.row:hover .sign {
		color: var(--accent);
	}
	.panel {
		height: 0;
		overflow: hidden;
	}
	.row.open .panel {
		height: auto;
	}
	.panel-inner {
		position: relative;
		padding-left: 120px;
	}
	/* Empty slots are hatched, not blank: a redacted sheet rather than a missing one. */
	.panel-inner.redacted {
		background-image: repeating-linear-gradient(
			-45deg,
			var(--line) 0 1px,
			transparent 1px 6px
		);
		background-size: 8px 8px;
	}
	.panel-inner.redacted::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			to bottom,
			transparent 0%,
			color-mix(in srgb, var(--ground) 55%, transparent) 50%,
			transparent 100%
		);
		animation: scanline 3.2s linear infinite;
	}
	@keyframes scanline {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(100%);
		}
	}
	.stamp {
		display: inline-block;
		border: 1px solid var(--alert);
		color: var(--alert);
		padding: 3px 8px;
		letter-spacing: 0.2em;
		margin-bottom: var(--s-3);
		transform: rotate(-1.5deg);
	}
	@media (prefers-reduced-motion: reduce) {
		.panel-inner.redacted::after {
			animation: none;
			display: none;
		}
	}
	.row.open .panel-inner {
		padding-bottom: var(--s-5);
	}
	@media (prefers-reduced-motion: reduce) {
		.row.open .panel {
			height: auto;
		}
	}
	.summary-text {
		max-width: 58ch;
		font-size: 1rem;
		line-height: 1.55;
		margin-bottom: var(--s-3);
	}
	.body {
		max-width: 58ch;
		font-size: 0.92rem;
		line-height: 1.6;
		color: var(--ink-2);
		margin-bottom: var(--s-2);
	}
	.body.todo {
		border-left: 2px solid var(--accent);
		padding-left: var(--s-3);
	}
	.ext {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-top: var(--s-2);
		padding: 0 var(--s-3);
		color: var(--accent);
		text-decoration: none;
		border: 1px solid var(--accent);
	}
	.ext:hover {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.index {
		position: absolute;
		right: 0;
		top: 0;
		color: transparent;
	}
	@media (max-width: 860px) {
		.head {
			grid-template-columns: 1fr;
			gap: var(--s-3);
		}
		.summary {
			grid-template-columns: 1fr auto;
			grid-template-areas:
				'id status'
				'title title'
				'cat year';
			gap: var(--s-2);
			padding: var(--s-3) 0;
			min-height: 44px;
		}
		.id {
			grid-area: id;
		}
		.status {
			grid-area: status;
			text-align: right;
		}
		.title {
			grid-area: title;
		}
		.cat {
			grid-area: cat;
		}
		.year {
			grid-area: year;
			text-align: right;
		}
		.sign {
			display: none;
		}
		.panel-inner {
			padding-left: 0;
		}
	}
</style>
