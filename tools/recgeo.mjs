import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);

const dump = async (label) => p.evaluate((label) => {
	const r = (sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		const x = el.getBoundingClientRect();
		return { t: Math.round(x.top), b: Math.round(x.bottom), h: Math.round(x.height), w: Math.round(x.width) };
	};
	const nodes = [...document.querySelectorAll('.node')].map((n) => {
		const x = n.getBoundingClientRect();
		return { t: Math.round(x.top), l: Math.round(x.left), o: getComputedStyle(n).opacity };
	});
	return {
		label,
		scrollY: Math.round(window.scrollY),
		record: r('#record'),
		pin: r('.pin'),
		spacer: r('.pin-spacer'),
		track: r('.track'),
		trackX: document.querySelector('.track') ? getComputedStyle(document.querySelector('.track')).transform : null,
		stack: r('#stack'),
		nodes,
		docH: document.documentElement.scrollHeight
	};
}, label);

const rows = [];
rows.push(await dump('top'));
for (const d of [400, 400, 400, 400, 400]) {
	await p.evaluate((x) => window.scrollBy(0, x), d);
	await p.waitForTimeout(600);
	rows.push(await dump(`+${d}`));
}
console.log(JSON.stringify(rows, null, 1));
await b.close();
