import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);
await p.evaluate(() => window.scrollTo(0, 3300));
await p.waitForTimeout(1800);
const out = await p.evaluate(() => {
	const el = document.querySelector('.fuji');
	const bub = document.querySelector('.bubble');
	const f = el?.getBoundingClientRect();
	const br = bub?.getBoundingClientRect();
	const texts = [...document.querySelectorAll('h1,h2,h3,p')].filter((t) => {
		if (bub && (bub.contains(t) || t.contains(bub))) return false;
		const r = t.getBoundingClientRect();
		if (!br || r.width === 0) return false;
		return !(br.right < r.left || br.left > r.right || br.bottom < r.top || br.top > r.bottom);
	}).map((t) => `${t.tagName}:${(t.textContent || '').trim().slice(0, 20)}`);
	return {
		fuji: f ? { l: Math.round(f.left), t: Math.round(f.top) } : null,
		bubble: br ? { l: Math.round(br.left), r: Math.round(br.right), t: Math.round(br.top), w: Math.round(br.width) } : null,
		offscreenLeft: br ? br.left < 0 : null,
		overlapsText: texts.slice(0, 5),
		text: bub?.textContent?.trim() ?? null
	};
});
await p.screenshot({ path: '.shots-p2/bubble.png' });
console.log(JSON.stringify(out, null, 1));
await b.close();
