import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const logs = [];
p.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`));
p.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
await p.addInitScript(() => {
	window.__probe = { tier: null, boot: 0 };
});
await p.goto('http://127.0.0.1:5173/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
	const c = document.querySelector('canvas.gl');
	const cs = c ? getComputedStyle(c) : null;
	return {
		hasCanvas: !!c,
		canvasAttrs: c ? { w: c.width, h: c.height } : null,
		styleWidth: cs?.width,
		opacity: cs?.opacity,
		classes: c?.className,
		hw: navigator.hardwareConcurrency,
		coarse: matchMedia('(pointer: coarse)').matches,
		narrow: matchMedia('(max-width: 767px)').matches,
		reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
		webgl2: !!document.createElement('canvas').getContext('webgl2')
	};
});
console.log(JSON.stringify({ out, logs: logs.slice(0, 12) }, null, 2));
await b.close();
