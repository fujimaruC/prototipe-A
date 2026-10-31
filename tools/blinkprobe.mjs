import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(2200);
const seen = new Set();
for (let i = 0; i < 160; i++) {
	seen.add(await p.evaluate(() => document.querySelector('.fuji')?.getAttribute('data-frame')));
	await p.waitForTimeout(50);
}
console.log(JSON.stringify({ framesSeen: [...seen] }));
await b.close();
