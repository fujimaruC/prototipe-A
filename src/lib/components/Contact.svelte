<script lang="ts">
import { contact, identity } from '$lib/content';

let copied = $state<'idle' | 'copied' | 'unavailable'>('idle');

async function copy() {
	if (!contact.email) return;
	try {
		await navigator.clipboard.writeText(contact.email);
		copied = 'copied';
		window.setTimeout(() => (copied = 'idle'), 2000);
	} catch {
		copied = 'unavailable';
	}
}
</script>

<section data-reveal class="contact" id="contact" aria-labelledby="contact-h">
	<div class="inner">
		<h2 data-reveal-head data-skew data-platform id="contact-h" class="display">Open a line</h2>
		<p data-reveal-meta class="avail">{contact.availability}</p>

		<div class="line">
			{#if contact.email}
				<a class="mail" href="mailto:{contact.email}">{contact.email}</a>
				<button class="copy mono--micro" onclick={copy}>
					{#if copied === 'copied'}Copied{:else if copied === 'unavailable'}Copy failed{:else}Copy{/if}
				</button>
			{:else}
				<p class="pending">
					<span class="mono--micro flag">Offline</span>
					Email is not published yet. Use GitHub to open a line in the meantime.
				</p>
			{/if}
		</div>

		<ul class="links">
			{#each contact.links.filter((l) => l.href !== '#') as l (l.label)}
				<li>
					<a href={l.href} rel="me noopener noreferrer" target="_blank">
						<span class="llabel">{l.label}</span>
						<span class="lhandle mono--micro">{l.note}</span>
					</a>
				</li>
			{/each}
		</ul>

		<p class="where mono--micro">{identity.location} · {identity.timezone}</p>
	</div>
</section>

<style>
	.contact {
		padding: var(--s-9) 0 var(--s-8);
	}
	.inner {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}
	.display {
		font-family: var(--font-display);
		font-size: clamp(2.6rem, 8vw, 6rem);
		line-height: 0.86;
		letter-spacing: -0.04em;
		font-weight: 800;
		font-stretch: 80%;
		text-transform: uppercase;
		max-width: 12ch;
	}
	.avail {
		font-size: 1rem;
		color: var(--ink-2);
		max-width: 44ch;
		line-height: 1.55;
	}
	.line {
		display: flex;
		align-items: center;
		gap: var(--s-4);
		flex-wrap: wrap;
		border-top: var(--hair) solid var(--line-strong);
		border-bottom: var(--hair) solid var(--line-strong);
		padding: var(--s-4) 0;
		margin-top: var(--s-4);
	}
	.mail {
		font-family: var(--font-mono);
		font-size: clamp(1rem, 2.4vw, 1.5rem);
		letter-spacing: -0.01em;
		text-decoration: none;
		border-bottom: 2px solid var(--accent);
		padding-bottom: 3px;
		transition: background-color var(--dur-1) var(--ease-draw), color var(--dur-1) var(--ease-draw);
	}
	.mail:hover {
		background: var(--accent);
		color: var(--accent-ink);
	}
	.copy {
		min-height: 44px;
		min-width: 88px;
		border: var(--hair) solid var(--line-strong);
		padding: 0 var(--s-3);
		color: var(--ink-2);
	}
	.copy:hover {
		background: var(--ink);
		color: var(--ground);
	}
	.pending {
		display: flex;
		gap: var(--s-3);
		align-items: baseline;
		color: var(--ink-2);
		font-size: 0.92rem;
		flex-wrap: wrap;
	}
	.flag {
		border: 1px dashed var(--accent);
		color: var(--accent);
		padding: 2px 6px;
	}
	.links {
		list-style: none;
		margin: var(--s-4) 0 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0 var(--s-5);
	}
	.links a {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: var(--s-3);
		padding: var(--s-3) 0;
		border-bottom: var(--hair) solid var(--line);
		text-decoration: none;
		min-height: 44px;
	}
	.links a:hover .llabel {
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	.links a:hover .lhandle {
		color: var(--accent);
	}
	.llabel {
		font-size: 0.98rem;
		font-weight: 600;
	}
	.lhandle {
		color: var(--ink-3);
	}
	.where {
		color: var(--ink-3);
		margin-top: var(--s-3);
	}
</style>
