import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://127.0.0.1:5173/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
	const pick = (sel) => {
		const el = document.querySelector(sel);
		if (!el) return { sel, missing: true };
		const cs = getComputedStyle(el);
		return { sel, bg: cs.backgroundColor, z: cs.zIndex, pos: cs.position };
	};
	return {
		foot: pick('.hero-foot'),
		strip: pick('.portstrip'),
		side: pick('.hero-side'),
		frame: pick('.frame'),
		profile: pick('#profile'),
		// does anything opaque sit above the canvas at the foot's centre?
		hit: (() => {
			const el = document.querySelector('.hero-foot');
			const r = el.getBoundingClientRect();
			const h = document.elementFromPoint(r.left + 200, r.top + r.height / 2);
			return h ? `${h.tagName}.${h.className}`.slice(0, 40) : null;
		})()
	};
});
console.log(JSON.stringify(out, null, 2));
await b.close();
