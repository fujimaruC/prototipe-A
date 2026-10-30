import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('https://fujimaruC.github.io/prototipe-A/', { waitUntil: 'networkidle', timeout: 60000 });
await p.waitForTimeout(3500);
const out = await p.evaluate(() => {
	const f = document.querySelector('.fuji');
	const bub = document.querySelector('.bubble');
	const fr = f?.getBoundingClientRect();
	const br = bub?.getBoundingClientRect();
	return {
		fuji: fr ? { t: Math.round(fr.top), b: Math.round(fr.bottom), l: Math.round(fr.left) } : null,
		bubble: br ? { t: Math.round(br.top), b: Math.round(br.bottom), text: bub.textContent.trim().slice(0, 30) } : null,
		bubbleClipped: br ? br.bottom > window.innerHeight || br.top < 0 : null,
		viewportH: window.innerHeight
	};
});
console.log(JSON.stringify(out, null, 1));
await b.close();
