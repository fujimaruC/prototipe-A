import { chromium, devices } from 'playwright';
const B = 'https://fujimaruC.github.io/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const d = await b.newPage({ viewport: { width: 1394, height: 723 } });
const bad = [];
d.on('pageerror', (e) => bad.push(e.message));
await d.goto(B + '?quality=high', { waitUntil: 'networkidle', timeout: 60000 });
await d.waitForTimeout(4000);
const desk = await d.evaluate(() => {
	const f = document.querySelector('.fuji');
	const fr = f?.getBoundingClientRect();
	return {
		fuji: fr ? { t: Math.round(fr.top), b: Math.round(fr.bottom) } : null,
		aboveFold: fr ? fr.top >= 0 && fr.bottom <= window.innerHeight : null,
		markers: document.querySelectorAll('.tp .target').length,
		canvas: document.querySelectorAll('canvas.gl').length
	};
});
await d.screenshot({ path: '.shots-p2/live-final-desk.png' });
await d.close();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const m = await ctx.newPage();
await m.goto(B, { waitUntil: 'networkidle', timeout: 60000 });
await m.waitForTimeout(3000);
const mob = await m.evaluate(() => ({
	fuji: document.querySelectorAll('.fuji').length,
	canvas: document.querySelectorAll('canvas.gl').length,
	markers: document.querySelectorAll('.tp .target').length,
	overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
}));
await ctx.close();
await b.close();
console.log(JSON.stringify({ desk, mob, bad: bad.slice(0, 3) }, null, 1));
