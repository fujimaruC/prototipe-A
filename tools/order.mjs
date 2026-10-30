import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
	const stops = [...document.querySelectorAll('.stop')].map((s) => ({
		year: s.querySelector('.year')?.textContent?.trim(),
		ev: s.querySelector('.ev')?.textContent?.trim()
	}));
	const path = document.querySelector('.path');
	return {
		stops,
		years: stops.map((s) => Number(s.year)),
		pathParent: path?.parentElement?.className ?? null
	};
});
const years = out.years;
const sorted = years.every((y, i) => i === 0 || years[i - 1] <= y);
console.log(JSON.stringify({ ...out, chronological: sorted }, null, 1));
await b.close();
