import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1394, height: 723 }, reducedMotion: 'reduce' });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://127.0.0.1:5173/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const s = await p.evaluate(() => ({
	preloader: !!document.querySelector('.pre'),
	canvas: !!document.querySelector('canvas.gl'),
	lens: !!document.querySelector('.lens'),
	glyphOpacity: getComputedStyle(document.querySelector('.glyph')).opacity,
	h1: document.querySelector('h1')?.innerText.trim().slice(0, 20),
	hiddenText: [...document.querySelectorAll('h1,h2,p,li,td')].filter((el) => {
		const cs = getComputedStyle(el);
		return cs.opacity === '0' || cs.visibility === 'hidden' || el.getBoundingClientRect().height === 0;
	}).length
}));
await p.screenshot({ path: '.shots/p0-reduced.png' });
console.log(JSON.stringify({ s, errs: errs.slice(0, 3) }));
await b.close();
