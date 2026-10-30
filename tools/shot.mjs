import { chromium } from 'playwright';
const B = process.argv[2] ?? 'http://127.0.0.1:5173/prototipe-A/';
const out = process.argv[3] ?? '.shots/p0-hero.png';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(4200);
const st = await p.evaluate(() => {
	const c = document.querySelector('canvas.gl');
	return { canvas: !!c, opacity: c ? getComputedStyle(c).opacity : null, w: c?.width, h: c?.height };
});
await p.screenshot({ path: out });
console.log(JSON.stringify({ st, errs: errs.slice(0, 4) }));
await b.close();
