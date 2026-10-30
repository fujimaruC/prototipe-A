import { chromium, devices } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const p = await ctx.newPage();
await p.goto('https://fujimaruC.github.io/prototipe-A/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(2500);
const out = await p.evaluate(() => {
	const c = document.querySelector('.cross');
	if (!c) return { exists: false };
	const cs = getComputedStyle(c);
	const r = c.getBoundingClientRect();
	return {
		exists: true,
		children: c.children.length,
		html: c.innerHTML.slice(0, 60),
		box: `${Math.round(r.width)}x${Math.round(r.height)}`,
		display: cs.display,
		bg: cs.backgroundColor,
		border: cs.borderWidth,
		zIndex: cs.zIndex,
		pointerEvents: cs.pointerEvents
	};
});
console.log(JSON.stringify(out, null, 1));
await b.close();
