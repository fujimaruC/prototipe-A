import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const read = async (label) => p.evaluate((label) => {
	const w = window;
	return {
		label,
		settles: w.__settleCount ?? 0,
		last: w.__lastSettle ?? null,
		bubble: document.querySelector('.bubble')?.textContent?.trim() ?? null,
		platforms: w.__fujimaru ? w.__fujimaru.platforms().map((x) => x.el.id || x.el.className).slice(0, 8) : []
	};
}, label);
const a = await read('start');
await p.evaluate(() => document.getElementById('stack').scrollIntoView());
await p.waitForTimeout(2600);
const c = await read('stack');
console.log(JSON.stringify({ a, c }, null, 2));
await b.close();
