<script lang="ts">
import { onMount } from 'svelte';
import CaseFiles from '$lib/components/CaseFiles.svelte';
import Contact from '$lib/components/Contact.svelte';
import Hero from '$lib/components/Hero.svelte';
import Profile from '$lib/components/Profile.svelte';
import Record from '$lib/components/Record.svelte';
import SideTabs from '$lib/components/SideTabs.svelte';
import Stack from '$lib/components/Stack.svelte';
import TestPoints from '$lib/components/TestPoints.svelte';
import { identity, meta } from '$lib/content';
import { onFrame } from '$lib/fx/driver';
import { prefersReducedMotion } from '$lib/fx/env';

let active = $state('profile');

onMount(() => {
	if (prefersReducedMotion()) return;
	const ids = ['home', 'profile', 'cases', 'record', 'stack', 'contact'];
	return onFrame(() => {
		let current = 'profile';
		for (const id of ids) {
			const el = document.getElementById(id);
			if (!el) continue;
			if (el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = id;
		}
		active = current;
	});
});

const jsonLd = $derived(
	JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: `${identity.first} ${identity.last}`,
		alternateName: ['N-EX', 'Fujimaru'],
		jobTitle: 'Network Engineer',
		description: meta.description,
		address: { '@type': 'PostalAddress', addressRegion: 'East Kalimantan', addressCountry: 'ID' },
		knowsAbout: ['network engineering', 'cybersecurity', 'MikroTik', 'Linux', 'CTF'],
	}),
);
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href="https://example.com/" />
	<meta property="og:type" content="profile" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:site_name" content={meta.siteName} />
	<meta name="twitter:card" content="summary_large_image" />
	{@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<span hidden data-tp="Q0tUe3RyNGNlX3RoZV9wNHRofQ" aria-hidden="true">TP-01</span>

<div class="layout">
	<SideTabs {active} />
	<div class="body">
		<Hero />
		<Profile />
		<CaseFiles />
		<Record />
		<Stack />
		<div class="contact-wrap">
			<Contact />
			<aside class="tp-wrap">
				<TestPoints />
			</aside>
		</div>
	</div>
</div>

<style>
	.layout {
		display: flex;
		align-items: flex-start;
	}
	.body {
		flex: 1;
		min-width: 0;
		position: relative;
		padding-left: clamp(0px, 2vw, 32px);
	}
	.contact-wrap {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(300px, 380px);
		gap: clamp(24px, 4vw, 64px);
		align-items: start;
		border-top: var(--hair) solid var(--line-strong);
	}
	.tp-wrap {
		padding-top: var(--s-8);
		position: sticky;
		top: 96px;
	}
	@media (max-width: 1023px) {
		.contact-wrap {
			grid-template-columns: 1fr;
			gap: 0;
		}
		.tp-wrap {
			padding: 0 0 var(--s-8);
			position: static;
		}
	}
	@media (max-width: 767px) {
		.layout {
			flex-direction: column;
			align-items: stretch;
		}
		.body {
			padding-left: 0;
		}
	}
</style>
