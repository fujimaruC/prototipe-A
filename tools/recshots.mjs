import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await (await import('node:fs/promises')).mkdir('.shots-p2', { recursive: true });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);
const shots = [['a', 2000], ['b', 2500], ['c', 2900], ['d', 3300]];
for (const [name, y] of shots) {
	await p.evaluate((t) => window.scrollTo(0, t), y);
	await p.waitForTimeout(800);
	await p.screenshot({ path: `.shots-p2/record-${name}.png` });
}
console.log('captured', shots.map((s) => s[0]).join(','));
await b.close();
