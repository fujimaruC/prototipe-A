import { chromium } from 'playwright';
const B = 'http://127.0.0.1:5173/prototipe-A/';
const b = await chromium.launch();
for (const [label, w, h] of [['desktop', 1394, 723], ['mobile', 390, 844]]) {
	for (const theme of ['light', 'negative']) {
		const p = await b.newPage({ viewport: { width: w, height: h } });
		await p.goto(B, { waitUntil: 'networkidle' });
		await p.waitForTimeout(1400);
		if (theme === 'negative') {
			await p.getByRole('button', { name: /Positive/ }).click();
			await p.waitForTimeout(600);
		}
		await p.evaluate(() => window.scrollTo(0, 0));
		await p.waitForTimeout(300);
		await p.screenshot({ path: `.shots/before/${label}-${theme}-fold.png` });
		await p.screenshot({ path: `.shots/before/${label}-${theme}-full.png`, fullPage: true });
		await p.close();
	}
}
await b.close();
console.log('done');
