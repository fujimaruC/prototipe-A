import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const out = await p.evaluate(() => ({
	pin: !!document.querySelector('.pin'),
	track: !!document.querySelector('.track'),
	stop: document.querySelectorAll('.stop').length,
	node: document.querySelectorAll('.node').length,
	strip: !!document.querySelector('.strip'),
	srTable: !!document.querySelector('table.sr-only'),
	innerW: window.innerWidth,
	fuji: !!document.querySelector('.fuji'),
	settles: window.__settleCount ?? 0,
	bubble: document.querySelector('.bubble')?.textContent?.trim() ?? null
}));
console.log(JSON.stringify({ out, errs: errs.slice(0, 5) }, null, 2));
await b.close();
