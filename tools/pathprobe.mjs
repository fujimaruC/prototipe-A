import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.evaluate(() => window.scrollTo(0, 2500));
await p.waitForTimeout(900);
const out = await p.evaluate(() => {
	const svg = document.querySelector('.path');
	const path = document.querySelector('.path path');
	if (!svg || !path) return { missing: true };
	const sr = svg.getBoundingClientRect();
	const pr = path.getBoundingClientRect();
	const cs = getComputedStyle(path);
	return {
		svgBox: { l: Math.round(sr.left), t: Math.round(sr.top), w: Math.round(sr.width), h: Math.round(sr.height) },
		pathBox: { l: Math.round(pr.left), t: Math.round(pr.top), w: Math.round(pr.width), h: Math.round(pr.height) },
		dasharray: cs.strokeDasharray,
		dashoffset: cs.strokeDashoffset,
		stroke: cs.stroke,
		strokeWidth: cs.strokeWidth,
		opacity: cs.opacity,
		totalLength: path.getTotalLength ? Math.round(path.getTotalLength()) : null,
		svgDisplay: getComputedStyle(svg).display,
		svgPos: getComputedStyle(svg).position
	};
});
console.log(JSON.stringify(out, null, 1));
await b.close();
