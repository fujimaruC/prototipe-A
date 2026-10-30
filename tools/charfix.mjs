import { chromium, devices } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const B = 'http://localhost:4400/prototipe-A/';

// desktop at scroll 0
const d = await b.newPage({ viewport: { width: 1394, height: 723 } });
await d.goto(B + '?quality=high', { waitUntil: 'networkidle' });
await d.waitForTimeout(3500);
const desk = await d.evaluate(() => {
	const f = document.querySelector('.fuji');
	const bub = document.querySelector('.bubble');
	const fr = f?.getBoundingClientRect();
	const br = bub?.getBoundingClientRect();
	return {
		fuji: fr ? { t: Math.round(fr.top), b: Math.round(fr.bottom) } : null,
		bubble: br ? { t: Math.round(br.top), b: Math.round(br.bottom) } : null,
		aboveFold: fr ? fr.bottom <= window.innerHeight && fr.top >= 0 : null,
		bubbleVisible: br ? br.top >= 0 && br.bottom <= window.innerHeight : null,
		viewportH: window.innerHeight
	};
});
await d.screenshot({ path: '.shots-p2/fix-desk.png' });
await d.close();

// mobile with touch
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const m = await ctx.newPage();
await m.goto(B, { waitUntil: 'networkidle' });
await m.waitForTimeout(2500);
const mob = await m.evaluate(() => ({
	fuji: document.querySelectorAll('.fuji').length,
	canvas: document.querySelectorAll('canvas.gl').length,
	markers: document.querySelectorAll('.tp .target').length
}));
await ctx.close();
await b.close();
console.log(JSON.stringify({ desk, mob }, null, 1));
