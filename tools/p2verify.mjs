import { chromium } from 'playwright';
const B = 'http://127.0.0.1:5173/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const out = [];

// desktop: record pin + stack rack
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	const errs = [];
	p.on('pageerror', (e) => errs.push(e.message));
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
	await p.waitForTimeout(3200);

	// record: scroll into the pin and capture two scrub positions
	await p.evaluate(() => document.getElementById('record').scrollIntoView());
	await p.waitForTimeout(900);
	await p.screenshot({ path: '.shots/p2-record-a.png' });
	await p.evaluate(() => window.scrollBy(0, 700));
	await p.waitForTimeout(900);
	await p.screenshot({ path: '.shots/p2-record-b.png' });

	// stack
	await p.evaluate(() => document.getElementById('stack').scrollIntoView());
	await p.waitForTimeout(900);
	await p.locator('.unit').nth(1).hover();
	await p.waitForTimeout(500);
	await p.screenshot({ path: '.shots/p2-stack.png' });

	// character bubble clears on travel
	await p.evaluate(() => document.getElementById('cases').scrollIntoView());
	await p.waitForTimeout(1500);
	const b1 = await p.locator('.bubble').innerText().catch(() => '');
	await p.evaluate(() => document.getElementById('stack').scrollIntoView());
	await p.waitForTimeout(2200);
	const b2 = await p.locator('.bubble').innerText().catch(() => '');
	out.push({ recordPin: await p.locator('.pin').count(), rack: await p.locator('.rack').count(), bubbleCases: b1, bubbleStack: b2, bubbleChanged: b1 !== b2, errs: errs.slice(0, 3) });
	await p.close();
}
// mobile: fallback strip, no rack tilt, no character
{
	const p = await b.newPage({ viewport: { width: 390, height: 844 } });
	await p.goto(B, { waitUntil: 'networkidle' });
	await p.waitForTimeout(1800);
	await p.evaluate(() => document.getElementById('record').scrollIntoView());
	await p.waitForTimeout(800);
	await p.screenshot({ path: '.shots/p2-record-mobile.png' });
	out.push({
		mobile: true,
		pin: await p.locator('.pin').count(),
		strip: await p.locator('.strip').count(),
		char: await p.locator('.fuji').count()
	});
	await p.close();
}
// reduced motion: no pin, strip present, table present
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 }, reducedMotion: 'reduce' });
	await p.goto(B, { waitUntil: 'networkidle' });
	await p.waitForTimeout(1200);
	out.push({
		reduced: true,
		pin: await p.locator('.pin').count(),
		strip: await p.locator('.strip').count(),
		srTable: await p.locator('table.sr-only').count(),
		char: await p.locator('.fuji').count()
	});
	await p.close();
}
await b.close();
console.log(JSON.stringify(out, null, 2));
