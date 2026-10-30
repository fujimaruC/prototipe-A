import { chromium, devices } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
await p.goto('https://fujimaruC.github.io/prototipe-A/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => ({
	coarse: matchMedia('(pointer: coarse)').matches,
	fine: matchMedia('(hover: hover) and (pointer: fine)').matches,
	crosshair: !!document.querySelector('.cross'),
	crossLines: document.querySelectorAll('.cross .line-x, .cross .line-y').length,
	readout: document.querySelector('.cross .readout')?.textContent?.trim() ?? null,
	fuji: document.querySelectorAll('.fuji').length,
	canvas: document.querySelectorAll('canvas.gl').length
}));
await p.screenshot({ path: '.shots-p2/mob-touch.png' });
console.log(JSON.stringify(out, null, 1));
await b.close();
