import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('https://fujimaruC.github.io/prototipe-A/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => {
	const c = document.querySelector('.cable');
	const svg = c?.querySelector('svg');
	const r = c?.getBoundingClientRect();
	const sr = svg?.getBoundingClientRect();
	return {
		cableExists: !!c,
		cableBox: r ? { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) } : null,
		svgBox: sr ? { t: Math.round(sr.top), h: Math.round(sr.height), w: Math.round(sr.width) } : null,
		overflow: r ? r.bottom > window.innerHeight : null,
		// how many segments are drawn
		segments: document.querySelectorAll('.cable .seg').length,
		display: c ? getComputedStyle(c).display : null
	};
});
await p.screenshot({ path: '.shots-p2/mob-hero-full.png', fullPage: false });
console.log(JSON.stringify(out, null, 1));
await b.close();
