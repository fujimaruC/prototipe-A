import { chromium } from 'playwright';
const B = 'https://fujimaruC.github.io/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const out = {};
for (const [name, w, h] of [['desk', 1394, 723], ['mob', 390, 844]]) {
	const p = await b.newPage({ viewport: { width: w, height: h } });
	const bad = [];
	p.on('pageerror', (e) => bad.push(e.message));
	p.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().split('/').pop()}`); });
	await p.goto(B + '?quality=high', { waitUntil: 'networkidle', timeout: 60000 });
	await p.waitForTimeout(4000);
	const state = await p.evaluate(() => ({
		h1: document.querySelector('h1')?.innerText.replace(/\n/g, ' ').trim().slice(0, 24),
		fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
		markers: document.querySelectorAll('.tp .target').length,
		tpCell: [...document.querySelectorAll('.telemetry .cell')].find((c) => c.textContent.trim().startsWith('TP'))?.textContent.trim() ?? null,
		fuji: !!document.querySelector('.fuji'),
		canvas: document.querySelectorAll('canvas.gl').length,
		rail: !!document.querySelector('.rail')
	}));
	await p.screenshot({ path: `.shots-p2/live-${name}.png` });
	await p.getByRole('button', { name: /Positive|Negative/ }).click().catch(() => {});
	await p.waitForTimeout(800);
	await p.screenshot({ path: `.shots-p2/live-${name}-neg.png` });
	out[name] = { state, bad: bad.slice(0, 4) };
	await p.close();
}
await b.close();
console.log(JSON.stringify(out, null, 1));
