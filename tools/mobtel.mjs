import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:4400/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);
const out = await p.evaluate(() => {
	const bar = document.querySelector('.telemetry');
	// display:none cells report top 0 and would be counted as a phantom second row
	const cells = [...document.querySelectorAll('.telemetry .cell')]
		.map((c) => {
			const r = c.getBoundingClientRect();
			return { text: c.textContent.trim().slice(0, 12), top: Math.round(r.top), h: Math.round(r.height) };
		})
		.filter((c) => c.h > 0);
	const r = bar.getBoundingClientRect();
	return {
		barHeight: Math.round(r.height),
		rows: new Set(cells.map((c) => c.top)).size,
		cells,
		tpOnRow1: cells.some((c) => c.text.startsWith('TP') && c.top === Math.min(...cells.map((x) => x.top)))
	};
});
console.log(JSON.stringify(out, null, 1));
await b.close();
