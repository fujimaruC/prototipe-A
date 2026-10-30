import { chromium } from 'playwright';

const b = await chromium.launch();
for (const [name, w, h, cpu] of [
	['desktop', 1440, 900, 1],
	['phone', 390, 844, 4],
]) {
	const ctx = await b.newContext({ viewport: { width: w, height: h } });
	const p = await ctx.newPage();
	const cdp = await ctx.newCDPSession(p);
	await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
	await p.addInitScript(() => {
		window.__vitals = { lcp: 0, cls: 0, shifts: [] };
		new PerformanceObserver((l) => {
			for (const e of l.getEntries()) window.__vitals.lcp = e.startTime;
		}).observe({ type: 'largest-contentful-paint', buffered: true });
		new PerformanceObserver((l) => {
			for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
		}).observe({ type: 'layout-shift', buffered: true });
	});
	await p.goto('http://localhost:4400/', { waitUntil: 'networkidle' });
	await p.waitForTimeout(2500);
	const v = await p.evaluate(() => ({
		...window.__vitals,
		fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
		transfer: performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0),
	}));
	console.log(
		`${name}: LCP ${Math.round(v.lcp)}ms  CLS ${v.cls.toFixed(4)}  FCP ${Math.round(v.fcp ?? 0)}ms  transfer ${Math.round(v.transfer / 1024)}KB (cpu x${cpu})`,
	);
	await ctx.close();
}
await b.close();
