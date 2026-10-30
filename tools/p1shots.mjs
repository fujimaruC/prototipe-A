import { chromium } from 'playwright';
const B = 'http://127.0.0.1:5173/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];

// hero with heat layer
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	p.on('pageerror', (e) => errs.push(e.message));
	p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
	await p.waitForTimeout(4200);
	await p.screenshot({ path: '.shots/p1-hero.png' });
	// reveal state: scroll to cases
	await p.evaluate(() => document.getElementById('cases').scrollIntoView());
	await p.waitForTimeout(1100);
	await p.screenshot({ path: '.shots/p1-cases.png' });
	// open a redacted slot
	await p.locator('.row').nth(1).locator('.summary').click();
	await p.waitForTimeout(900);
	await p.screenshot({ path: '.shots/p1-redacted.png' });
	await p.close();
}
// mobile
{
	const p = await b.newPage({ viewport: { width: 390, height: 844 } });
	await p.goto(B, { waitUntil: 'networkidle' });
	await p.waitForTimeout(2200);
	await p.evaluate(() => document.getElementById('cases').scrollIntoView());
	await p.waitForTimeout(900);
	await p.screenshot({ path: '.shots/p1-mobile.png' });
	await p.close();
}
await b.close();
console.log(JSON.stringify({ errs: errs.slice(0, 5) }));
