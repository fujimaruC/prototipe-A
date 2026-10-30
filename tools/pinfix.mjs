import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);

// scroll well past the pin start (pin starts around 1868)
const dump = async (label) => p.evaluate((label) => {
	const pin = document.querySelector('.pin');
	const track = document.querySelector('.track');
	const x = pin.getBoundingClientRect();
	return {
		label,
		scrollY: Math.round(window.scrollY),
		pinTop: Math.round(x.top),
		pinPos: getComputedStyle(pin).position,
		trackX: track ? Math.round(new DOMMatrix(getComputedStyle(track).transform).m41) : null,
		nodes: [...document.querySelectorAll('.node')].map((n) => getComputedStyle(n).opacity)
	};
}, label);

const rows = [];
for (const target of [1700, 2100, 2500, 2900, 3300]) {
	await p.evaluate((t) => window.scrollTo(0, t), target);
	await p.waitForTimeout(700);
	rows.push(await dump(`scroll ${target}`));
}
console.log(JSON.stringify(rows, null, 1));
await b.close();
