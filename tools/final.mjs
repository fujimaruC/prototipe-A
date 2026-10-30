import { chromium } from 'playwright';
const B = 'http://localhost:4400/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [name, w, h] of [['desk', 1394, 723], ['mob', 390, 844]]) {
	for (const theme of ['pos', 'neg']) {
		const p = await b.newPage({ viewport: { width: w, height: h } });
		await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
		await p.waitForTimeout(3200);
		if (theme === 'neg') {
			await p.getByRole('button', { name: /Positive/ }).click();
			await p.waitForTimeout(800);
		}
		await p.evaluate(() => window.scrollTo(0, 0));
		await p.waitForTimeout(400);
		await p.screenshot({ path: `.shots-p2/final-${name}-${theme}.png` });
		await p.close();
	}
}
await b.close();
console.log('final shots done');
