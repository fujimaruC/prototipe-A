import { chromium, devices } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const B = 'http://localhost:4400/prototipe-A/';

const overlapAt = async (p, label) => p.evaluate((label) => {
	const f = document.querySelector('.fuji');
	const bub = document.querySelector('.bubble');
	const texts = [...document.querySelectorAll('p, li, dd, dt, h1, h2, a, button, span')]
		.filter((t) => !bub?.contains(t) && !f?.contains(t));
	const hit = (el) => {
		if (!el) return null;
		const r = el.getBoundingClientRect();
		const over = texts.filter((t) => {
			const tr = t.getBoundingClientRect();
			if (tr.width < 2 || tr.height < 2) return false;
			const pad = 2;
			return !(r.right - pad < tr.left || r.left + pad > tr.right || r.bottom - pad < tr.top || r.top + pad > tr.bottom);
		}).map((t) => `${t.tagName}:${(t.textContent || '').trim().slice(0, 22)}`);
		return { box: { l: Math.round(r.left), t: Math.round(r.top) }, over: over.slice(0, 3), count: over.length };
	};
	return { label, fuji: hit(f), bubble: hit(bub) };
}, label);

// desktop
const d = await b.newPage({ viewport: { width: 1394, height: 723 } });
await d.goto(B + '?quality=high', { waitUntil: 'networkidle' });
await d.waitForTimeout(3200);
const home = await overlapAt(d, 'home');
await d.screenshot({ path: '.shots-p2/final-home.png' });
await d.evaluate(() => document.getElementById('record').scrollIntoView());
await d.waitForTimeout(2200);
const rec = await overlapAt(d, 'record');
await d.screenshot({ path: '.shots-p2/final-record.png' });
await d.close();

// mobile
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const m = await ctx.newPage();
await m.goto(B, { waitUntil: 'networkidle' });
await m.waitForTimeout(2200);
await m.evaluate(() => document.getElementById('record').scrollIntoView());
await m.waitForTimeout(1200);
await m.screenshot({ path: '.shots-p2/final-mob-record.png' });
const mob = await m.evaluate(() => ({
	strip: document.querySelectorAll('.strip').length,
	fuji: document.querySelectorAll('.fuji').length,
	overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
}));
await ctx.close();
await b.close();
console.log(JSON.stringify({ home, rec, mob }, null, 1));
