import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://127.0.0.1:5173/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);

const snap = async (label) => p.evaluate((label) => {
	const el = document.querySelector('.fuji');
	const bubble = document.querySelector('.bubble');
	if (!el) return { label, missing: true };
	const r = el.getBoundingClientRect();
	const docY = r.top + window.scrollY;
	// which section's document box contains the sprite's feet?
	const secs = [...document.querySelectorAll('section[id], header[id]')].map((s) => {
		const sr = s.getBoundingClientRect();
		return { id: s.id, top: Math.round(sr.top + window.scrollY), bottom: Math.round(sr.bottom + window.scrollY) };
	});
	const inSec = secs.find((s) => docY >= s.top && docY <= s.bottom);
	return {
		label,
		mood: el.dataset.mood,
		docY: Math.round(docY),
		viewportY: Math.round(r.top),
		scrollY: Math.round(window.scrollY),
		inSection: inSec ? inSec.id : null,
		bubble: bubble ? bubble.textContent?.trim() : null,
		platforms: window.__fujimaru ? window.__fujimaru.platforms().length : 0
	};
}, label);

const s0 = await snap('start');
await p.evaluate(() => document.getElementById('cases').scrollIntoView());
await p.waitForTimeout(2500);
const s1 = await snap('cases');
await p.evaluate(() => document.getElementById('stack').scrollIntoView());
await p.waitForTimeout(2500);
const s2 = await snap('stack');
console.log(JSON.stringify([s0, s1, s2], null, 2));
await b.close();
