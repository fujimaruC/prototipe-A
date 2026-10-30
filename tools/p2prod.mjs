import { chromium } from 'playwright';
const B = 'http://localhost:4400/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });

await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3200);

const snap = async (label) => p.evaluate((label) => {
	const el = document.querySelector('.fuji');
	const bubble = document.querySelector('.bubble');
	const r = el ? el.getBoundingClientRect() : null;
	const docY = r ? r.top + window.scrollY : null;
	const secs = [...document.querySelectorAll('section[id], header[id]')].map((s) => {
		const sr = s.getBoundingClientRect();
		return { id: s.id, top: sr.top + window.scrollY, bottom: sr.bottom + window.scrollY };
	});
	const inSec = secs.find((s) => docY !== null && docY >= s.top && docY <= s.bottom);
	return {
		label,
		mood: el?.dataset.mood ?? null,
		docY: docY === null ? null : Math.round(docY),
		inSection: inSec?.id ?? null,
		bubble: bubble ? bubble.textContent?.trim() : null,
		settles: window.__settleCount ?? 0
	};
}, label);

const s0 = await snap('start');
await p.evaluate(() => document.getElementById('profile').scrollIntoView());
await p.waitForTimeout(2400);
const s1 = await snap('profile');
await p.evaluate(() => document.getElementById('stack').scrollIntoView());
await p.waitForTimeout(2400);
const s2 = await snap('stack');

// record: nodes visible? path aligned? two scrub positions
await p.evaluate(() => document.getElementById('record').scrollIntoView());
await p.waitForTimeout(1200);
const recA = await p.evaluate(() => {
	const pin = document.querySelector('.pin');
	const svg = document.querySelector('.path');
	const nodes = [...document.querySelectorAll('.node')];
	const pr = pin?.getBoundingClientRect();
	return {
		pinParentOfSvg: svg?.parentElement?.className ?? null,
		nodeCount: nodes.length,
		nodeOpacity: nodes.map((n) => getComputedStyle(n).opacity),
		svgRect: svg ? { t: Math.round(svg.getBoundingClientRect().top - (pr?.top ?? 0)), h: Math.round(svg.getBoundingClientRect().height) } : null,
		trackX: document.querySelector('.track') ? getComputedStyle(document.querySelector('.track')).transform : null,
		pinExists: !!pin,
		trackExists: !!document.querySelector('.track')
	};
});
await p.screenshot({ path: '.shots/p2-record-a.png' });
await p.evaluate(() => window.scrollBy(0, 600));
await p.waitForTimeout(1000);
await p.screenshot({ path: '.shots/p2-record-b.png' });
const recB = await p.evaluate(() => {
	const t = document.querySelector('.track');
	return {
		trackX: t ? getComputedStyle(t).transform : null,
		nodeOpacity: [...document.querySelectorAll('.node')].map((n) => getComputedStyle(n).opacity)
	};
});

console.log(JSON.stringify({ s0, s1, s2, recA, recB, errs: errs.slice(0, 3) }, null, 2));
await b.close();
