import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('https://fujimaruC.github.io/prototipe-A/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
	const px = 210, py = 340;
	const covering = [...document.querySelectorAll('*')].filter((el) => {
		const r = el.getBoundingClientRect();
		return r.width > 0 && r.height > 0 && px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
	}).map((el) => {
		const cs = getComputedStyle(el);
		const r = el.getBoundingClientRect();
		return `${el.tagName}.${String(el.className).slice(0, 26)} | ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} | pe:${cs.pointerEvents} op:${cs.opacity}`;
	});
	return {
		covering,
		fujiInDom: document.querySelectorAll('.fuji').length,
		cableRects: [...document.querySelectorAll('.cable')].map((c) => {
			const r = c.getBoundingClientRect();
			return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`;
		}),
		svgCount: document.querySelectorAll('svg').length
	};
});
console.log(JSON.stringify(out, null, 1));
await b.close();
