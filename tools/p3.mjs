import { chromium } from 'playwright';
const B = 'http://localhost:4400/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
await p.goto(B + '?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);

const markers = await p.evaluate(() => {
	const t = [...document.querySelectorAll('.tp .target')];
	return {
		count: t.length,
		ids: t.map((x) => x.querySelector('.id')?.textContent?.trim()),
		minHeight: Math.min(...t.map((x) => Math.round(x.getBoundingClientRect().height))),
		labels: t.map((x) => x.getAttribute('aria-label')).slice(0, 2)
	};
});
// expand one hint
await p.locator('.tp .target').first().click();
await p.waitForTimeout(300);
const hint = await p.evaluate(() => {
	const el = document.querySelector('.tp .hint');
	const btn = document.querySelector('.tp .target');
	return {
		text: el?.textContent?.trim() ?? '',
		hidden: el?.hasAttribute('hidden') ?? null,
		expanded: btn?.getAttribute('aria-expanded') ?? null
	};
});

const telemetry = await p.evaluate(() => {
	const cells = [...document.querySelectorAll('.telemetry .cell')].map((c) => c.textContent.trim());
	return cells.find((c) => c.startsWith('TP')) ?? null;
});

// konami
for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) await p.keyboard.press(k);
await p.waitForTimeout(600);
const konami = await p.evaluate(() => ({
	rain: document.querySelectorAll('.rain span').length,
	shades: !!document.querySelector('.fuji.shades'),
	glitch: !!document.querySelector('.frame.glitch')
}));
await p.screenshot({ path: '.shots-p2/p3-konami.png' });
console.log(JSON.stringify({ markers, hint, telemetry, konami, errs: errs.slice(0, 3) }, null, 1));
await b.close();
