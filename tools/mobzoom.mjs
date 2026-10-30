import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:4400/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
// what is actually painted around y=350 under the name?
const hits = await p.evaluate(() => {
	const y = 355;
	const out = [];
	for (const x of [120, 180, 210, 250]) {
		const el = document.elementFromPoint(x, y);
		out.push({ x, el: el ? `${el.tagName}.${String(el.className).slice(0, 40)}` : null });
	}
	return out;
});
await p.screenshot({ path: '.shots-p2/mob-zoom.png', clip: { x: 0, y: 230, width: 390, height: 260 } });
console.log(JSON.stringify(hits, null, 1));
await b.close();
