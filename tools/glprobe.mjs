import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto('http://127.0.0.1:5173/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const info = await p.evaluate(() => {
	const c = document.querySelector('canvas.gl');
	if (!c) return { canvas: false };
	const gl = c.getContext('webgl2') || c.getContext('webgl');
	return {
		canvas: true,
		w: c.width, h: c.height,
		styleW: c.style.width,
		opacity: getComputedStyle(c).opacity,
		glLost: gl ? gl.isContextLost() : 'no-ctx',
		tier: document.documentElement.dataset.mode
	};
});
await p.screenshot({ path: '.shots/p0-hero.png' });
console.log(JSON.stringify({ info, errs: errs.slice(0, 5) }, null, 2));
await b.close();
