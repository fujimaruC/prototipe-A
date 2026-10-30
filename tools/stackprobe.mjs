import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://127.0.0.1:5173/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3500);
const out = await p.evaluate(() => {
	const c = document.querySelector('canvas.gl');
	const f = document.querySelector('.frame');
	const cs = (el) => { const s = getComputedStyle(el); return { pos: s.position, z: s.zIndex, opacity: s.opacity }; };
	// what is actually painted at the centre of the "J"?
	const h1 = document.querySelector('h1');
	const r = h1.getBoundingClientRect();
	const hit = document.elementFromPoint(r.left + 40, r.top + 60);
	return {
		canvas: c ? { ...cs(c), parent: c.parentElement?.className, idx: [...document.body.children].indexOf(c) } : null,
		frame: f ? cs(f) : null,
		bodyChildren: [...document.body.children].map((e) => `${e.tagName}.${e.className}`.slice(0, 40)),
		hitAtJ: hit ? `${hit.tagName}.${hit.className}`.slice(0, 50) : null
	};
});
console.log(JSON.stringify(out, null, 2));
await b.close();
