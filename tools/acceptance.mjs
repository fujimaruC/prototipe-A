import { chromium } from 'playwright';
const B = 'http://localhost:4400/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const out = {};

// 1. preloader flows into the page
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	await p.goto(B + '?quality=high', { waitUntil: 'domcontentloaded' });
	const seen = [];
	for (let i = 0; i < 10; i++) {
		await p.waitForTimeout(200);
		seen.push(await p.evaluate(() => !!document.querySelector('.pre')));
	}
	out.preloaderAppearsAndLeaves = seen.some(Boolean) && !seen[seen.length - 1];
	await p.close();
}
// 2. one GL canvas, reacts to cursor; 6. counter persists
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
	await p.waitForTimeout(3200);
	out.glCanvasCount = await p.locator('canvas.gl').count();
	out.telemetryCounter = await p.evaluate(() => {
		const c = [...document.querySelectorAll('.telemetry .cell')].find((x) => x.textContent.trim().startsWith('TP'));
		return c?.textContent?.trim() ?? null;
	});
	// 3. character travels between platforms
	const before = await p.evaluate(() => document.querySelector('.fuji')?.getBoundingClientRect().top ?? null);
	await p.evaluate(() => document.getElementById('stack').scrollIntoView());
	await p.waitForTimeout(2400);
	const after = await p.evaluate(() => {
		const el = document.querySelector('.fuji');
		const r = el?.getBoundingClientRect();
		return r ? { top: Math.round(r.top), platforms: window.__fujimaru?.platforms().length ?? 0 } : null;
	});
	out.characterMoved = before !== null && after !== null && after.platforms >= 6;
	out.platformCount = after?.platforms ?? 0;
	// 4. theme toggle uses the ring
	await p.getByRole('button', { name: /Positive|Negative/ }).click();
	await p.waitForTimeout(120);
	out.ringOnToggle = await p.evaluate(() => document.querySelectorAll('body > div[style*="clip-path"]').length > 0);
	await p.close();
}
// 5. record journey + rack react
{
	const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
	await p.waitForTimeout(2800);
	await p.evaluate(() => window.scrollTo(0, 2500));
	await p.waitForTimeout(800);
	out.recordPinned = await p.evaluate(() => getComputedStyle(document.querySelector('.pin')).position === 'fixed');
	await p.evaluate(() => document.getElementById('stack').scrollIntoView());
	await p.waitForTimeout(800);
	await p.locator('.ehead').nth(1).hover();
	await p.waitForTimeout(400);
	out.rackReacts = await p.evaluate(() => !!document.querySelector('.unit.on'));
	await p.close();
}
await b.close();
console.log(JSON.stringify(out, null, 1));
