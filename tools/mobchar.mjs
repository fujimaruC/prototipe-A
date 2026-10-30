import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:4400/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(2000);
const out = await p.evaluate(() => {
	const el = document.querySelector('.fuji');
	const bub = document.querySelector('.bubble');
	const r = el?.getBoundingClientRect();
	const br = bub?.getBoundingClientRect();
	return {
		fujiExists: !!el,
		fujiDisplay: el ? getComputedStyle(el).display : null,
		fujiBox: r ? { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width) } : null,
		bubbleExists: !!bub,
		bubbleBox: br ? { t: Math.round(br.top), b: Math.round(br.bottom), h: Math.round(br.height) } : null,
		bubbleClipped: br ? br.bottom > window.innerHeight : null,
		innerW: window.innerWidth,
		mq639: matchMedia('(max-width: 639px)').matches
	};
});
console.log(JSON.stringify(out, null, 1));
await b.close();
