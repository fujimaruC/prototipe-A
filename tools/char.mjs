import { chromium } from 'playwright';
const B = 'http://127.0.0.1:5173/prototipe-A/?quality=high';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });

await p.goto(B, { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);

const probe = async (label) => p.evaluate((label) => {
	const el = document.querySelector('.fuji');
	if (!el) return { label, missing: true };
	const r = el.getBoundingClientRect();
	// does the sprite overlap any text?
	const texts = [...document.querySelectorAll('h1,h2,p,li,td,th,a,button')].filter((t) => {
		if (el.contains(t) || t.contains(el)) return false;
		const cs = getComputedStyle(t);
		if (cs.visibility === 'hidden' || cs.display === 'none') return false;
		const tr = t.getBoundingClientRect();
		if (tr.width === 0 || tr.height === 0) return false;
		// tolerance: the sprite's feet sit exactly on the platform's top edge, which is touching,
		// not covering. The platform element itself is excluded.
		const pad = 3;
		if (t.hasAttribute('data-platform')) return false;
		return !(r.right - pad < tr.left || r.left + pad > tr.right || r.bottom - pad < tr.top || r.top + pad > tr.bottom);
	}).map((t) => `${t.tagName}:${(t.textContent || '').trim().slice(0, 24)}`);
	const mood = el.dataset.mood;
	return {
		label,
		x: Math.round(r.left), y: Math.round(r.top),
		w: Math.round(r.width), h: Math.round(r.height),
		mood, overlaps: texts.slice(0, 4), overlapCount: texts.length,
		platforms: window.__fujimaru ? window.__fujimaru.platforms().length : 0
	};
}, label);

const s0 = await probe('initial');
await p.screenshot({ path: '.shots/p2-char.png' });

// scroll to cases and let it settle
await p.evaluate(() => document.getElementById('cases').scrollIntoView());
await p.waitForTimeout(1600);
const s1 = await probe('after-scroll');
await p.screenshot({ path: '.shots/p2-char-cases.png' });

// summon from the palette
await p.keyboard.press('/');
await p.waitForTimeout(400);
const hasSummon = await p.locator('.summon').count();
await p.locator('.summon').click();
await p.waitForTimeout(1400);
const s2 = await probe('after-summon');
await p.screenshot({ path: '.shots/p2-char-summon.png' });

// drag it
const box = await p.locator('.fuji').boundingBox();
if (box) {
	await p.mouse.move(box.x + 24, box.y + 24);
	await p.mouse.down();
	await p.mouse.move(box.x + 220, box.y + 90, { steps: 12 });
	await p.mouse.up();
	await p.waitForTimeout(1200);
}
const s3 = await probe('after-drag');

console.log(JSON.stringify({ s0, s1, s2, s3, hasSummon, errs: errs.slice(0, 4) }, null, 2));
await b.close();
