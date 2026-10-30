import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('https://fujimaruC.github.io/prototipe-A/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(3000);
const hits = await p.evaluate(() => {
	const pts = [[210, 335], [210, 345], [180, 600], [360, 620], [300, 760]];
	return pts.map(([x, y]) => {
		const el = document.elementFromPoint(x, y);
		return { x, y, el: el ? `${el.tagName}.${String(el.className).slice(0, 44)}` : null, text: (el?.textContent ?? '').trim().slice(0, 20) };
	});
});
const stack = await p.evaluate(() => {
	const el = document.querySelector('.hero');
	if (!el) return null;
	return [...el.querySelectorAll('*')].filter((n) => {
		const cs = getComputedStyle(n);
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0 && cs.position === 'absolute';
	}).map((n) => `${n.tagName}.${String(n.className).slice(0, 30)}`);
});
await p.screenshot({ path: '.shots-p2/mob-mark.png', clip: { x: 100, y: 280, width: 240, height: 120 } });
console.log(JSON.stringify({ hits, absoluteInHero: stack }, null, 1));
await b.close();
