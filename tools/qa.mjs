import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.argv[2] ?? 'http://localhost:4400';
const OUT = '.shots';
const WIDTHS = [
	{ name: 'desktop', w: 1440, h: 900 },
	{ name: 'laptop', w: 1280, h: 800 },
	{ name: 'tablet', w: 768, h: 1024 },
	{ name: 'phone', w: 375, h: 812 },
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const axeSrc = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const report = { console: [], pages: {}, axe: {}, focus: {}, overflow: {}, reduced: {} };

const browser = await chromium.launch();

async function shoot(name, w, h, { reduced = false, full = true, path: url = '/' } = {}) {
	const ctx = await browser.newContext({
		viewport: { width: w, height: h },
		deviceScaleFactor: 1,
		reducedMotion: reduced ? 'reduce' : 'no-preference',
	});
	const page = await ctx.newPage();
	page.on('console', (m) => {
		if (m.type() === 'error' || m.type() === 'warning') report.console.push(`${name}${url}: ${m.text()}`);
	});
	page.on('pageerror', (e) => report.console.push(`${name}${url} PAGEERROR: ${e.message}`));

	await page.goto(BASE + url, { waitUntil: 'networkidle' });
	await page.waitForTimeout(900);

	// overflow check
	const overflow = await page.evaluate(() => {
		const de = document.documentElement;
		return { scrollW: de.scrollWidth, clientW: de.clientWidth, over: de.scrollWidth > de.clientWidth + 1 };
	});
	report.overflow[`${name}${url}`] = overflow;

	// axe
	await page.addScriptTag({ content: axeSrc });
	const axe = await page.evaluate(async () => {
		// @ts-expect-error
		const r = await window.axe.run(document, {
			runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
		});
		return r.violations.map((v) => ({
			id: v.id,
			impact: v.impact,
			nodes: v.nodes.length,
			help: v.help,
			sample: v.nodes[0]?.target?.join(' '),
		}));
	});
	report.axe[`${name}${url}`] = axe;

	// reset scroll before capture so the fold shot is the real first frame
	await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(250);

	// keyboard walk: focus visible?
	const focus = [];
	for (let i = 0; i < 14; i++) {
		await page.keyboard.press('Tab');
		const f = await page.evaluate(() => {
			const el = document.activeElement;
			if (!el || el === document.body) return null;
			const cs = getComputedStyle(el);
			return {
				tag: el.tagName,
				text: (el.textContent || '').trim().slice(0, 28),
				outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
				box: el.getBoundingClientRect().width > 0,
			};
		});
		if (f) focus.push(f);
	}
	report.focus[`${name}${url}`] = focus;

	await page.evaluate(() => window.scrollTo(0, 0));
	await page.waitForTimeout(150);
	await page.screenshot({
		path: path.join(OUT, `${name}${url.replace(/\//g, '_') || '_'}-full.png`),
		fullPage: full,
	});
	await page.screenshot({ path: path.join(OUT, `${name}${url.replace(/\//g, '_') || '_'}-fold.png`) });

	await ctx.close();
}

for (const { name, w, h } of WIDTHS) {
	await shoot(name, w, h);
}
await shoot('desktop-reduced', 1440, 900, { reduced: true });
await shoot('phone-reduced', 375, 812, { reduced: true });
await shoot('desktop-secret', 1440, 900, { path: '/secret' });
await shoot('phone-secret', 375, 812, { path: '/secret' });
await shoot('desktop-404', 1440, 900, { path: '/nope' });

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

const violations = Object.entries(report.axe).flatMap(([k, v]) => v.map((x) => ({ page: k, ...x })));
const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
console.log('AXE serious/critical:', bad.length);
for (const b of bad) console.log(` - ${b.page} :: ${b.id} (${b.nodes}) ${b.sample ?? ''}`);
console.log(
	'AXE total nodes:',
	violations.reduce((a, v) => a + v.nodes, 0),
);
console.log('console errors:', report.console.length);
for (const c of report.console.slice(0, 8)) console.log('  !', c);
const over = Object.entries(report.overflow).filter(([, v]) => v.over);
console.log('overflow:', over.length, over.map(([k]) => k).join(', '));
const noOutline = Object.entries(report.focus).flatMap(([k, v]) =>
	v.filter((f) => !f.outline).map((f) => `${k}:${f.tag}`),
);
console.log('focus without outline:', noOutline.length, noOutline.slice(0, 6).join(', '));
