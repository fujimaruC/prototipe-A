import { chromium } from 'playwright';
const B = 'http://127.0.0.1:5173/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

// desktop hero + full page (positive)
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
	await p.waitForTimeout(3800);
	await p.mouse.move(400, 300);
	await p.waitForTimeout(700);
	await p.screenshot({ path: '.shots/p0-hero.png' });
	await p.evaluate(() => window.scrollTo(0, 1100));
	await p.waitForTimeout(900);
	await p.screenshot({ path: '.shots/p0-below.png' });
	await p.close();
}
// negative
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
	await p.waitForTimeout(3400);
	await p.getByRole('button', { name: /Positive/ }).click();
	await p.waitForTimeout(1000);
	await p.screenshot({ path: '.shots/p0-negative.png' });
	await p.close();
}
// mobile
{
	const p = await b.newPage({ viewport: { width: 390, height: 844 } });
	await p.goto(B, { waitUntil: 'networkidle' });
	await p.waitForTimeout(2400);
	await p.screenshot({ path: '.shots/p0-mobile.png' });
	await p.close();
}
await b.close();
console.log('ok');
