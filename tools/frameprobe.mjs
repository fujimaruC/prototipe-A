import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const samples = [];
for (let i = 0; i < 20; i++) {
	await p.waitForTimeout(350);
	samples.push(await p.evaluate(() => {
		const svg = document.querySelector('.fuji svg');
		if (!svg) return null;
		// hash the rect list, which differs per frame
		return svg.querySelectorAll('rect').length + ':' + (svg.innerHTML.charCodeAt(40) || 0);
	}));
}
const uniq = [...new Set(samples)];
await p.screenshot({ path: '.shots-p2/frame-check.png' });
console.log(JSON.stringify({ samples: samples.slice(0, 8), distinct: uniq.length, uniq: uniq.slice(0, 6), errs: errs.slice(0, 3) }, null, 1));
await b.close();
