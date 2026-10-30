import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [name, w, h] of [['mob-unpinned', 390, 844], ['desk-unpinned', 1394, 723]]) {
	const p = await b.newPage({ viewport: { width: w, height: h } });
	await p.goto('https://fujimaruC.github.io/prototipe-A/', { waitUntil: 'networkidle', timeout: 60000 });
	await p.waitForTimeout(4000);
	const s = await p.evaluate(() => ({
		canvas: document.querySelectorAll('canvas.gl').length,
		fuji: !!document.querySelector('.fuji'),
		lens: !!document.querySelector('.lens'),
		preloader: !!document.querySelector('.pre'),
		markers: document.querySelectorAll('.tp .target').length
	}));
	console.log(name, JSON.stringify(s));
	await p.close();
}
await b.close();
