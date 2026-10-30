import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 100)); });
await p.goto('http://127.0.0.1:5173/prototipe-A/?quality=high', { waitUntil: 'domcontentloaded' });
const samples = [];
for (let i = 0; i < 8; i++) {
	await p.waitForTimeout(220);
	const v = await p.evaluate(() => {
		const pre = document.querySelector('.pre');
		return {
			present: !!pre,
			count: document.querySelector('.count')?.textContent ?? null,
			barW: document.querySelector('.bar span')?.style.width ?? null,
			clip: pre ? getComputedStyle(pre).clipPath : null
		};
	});
	samples.push(v);
}
console.log(JSON.stringify({ samples, errs: errs.slice(0, 6) }, null, 2));
await b.close();
