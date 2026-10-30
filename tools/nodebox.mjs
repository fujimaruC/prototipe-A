import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
await p.evaluate(() => window.scrollTo(0, 3300));
await p.waitForTimeout(900);
const out = await p.evaluate(() => {
	const pin = document.querySelector('.pin');
	const svg = document.querySelector('.path');
	return {
		svgParent: svg?.parentElement?.className ?? null,
		svgBox: svg ? (() => { const r = svg.getBoundingClientRect(); return { l: Math.round(r.left), w: Math.round(r.width), t: Math.round(r.top) }; })() : null,
		pinBox: pin ? (() => { const r = pin.getBoundingClientRect(); return { l: Math.round(r.left), w: Math.round(r.width) }; })() : null,
		nodes: [...document.querySelectorAll('.node')].map((n) => {
			const r = n.getBoundingClientRect();
			const cs = getComputedStyle(n);
			return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), o: cs.opacity, bg: cs.backgroundColor, border: cs.borderColor, vis: cs.visibility };
		})
	};
});
await p.screenshot({ path: '.shots/p2-nodecheck.png' });
console.log(JSON.stringify(out, null, 1));
await b.close();
