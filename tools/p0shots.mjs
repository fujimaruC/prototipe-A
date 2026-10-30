import { chromium } from 'playwright';
const B = 'http://127.0.0.1:5173/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

// preloader mid-run
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	await p.goto(B + '?quality=high', { waitUntil: 'domcontentloaded' });
	await p.waitForTimeout(700);
	await p.screenshot({ path: '.shots/p0-preloader.png' });
	await p.close();
}
// negative theme, after intro
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
	await p.waitForTimeout(3200);
	await p.getByRole('button', { name: /Positive/ }).click();
	await p.waitForTimeout(900);
	await p.screenshot({ path: '.shots/p0-negative.png' });
	await p.close();
}
// mobile
{
	const p = await b.newPage({ viewport: { width: 390, height: 844 } });
	await p.goto(B, { waitUntil: 'networkidle' });
	await p.waitForTimeout(2500);
	await p.screenshot({ path: '.shots/p0-mobile.png' });
	await p.close();
}
await b.close();
console.log('shots done');
