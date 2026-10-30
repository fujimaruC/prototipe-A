import { chromium } from 'playwright';
const B = 'http://localhost:4400/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

// reduced motion: markers usable, no rain, no canvas, no lens, no sprite
const r = await b.newPage({ viewport: { width: 1394, height: 723 }, reducedMotion: 'reduce' });
await r.goto(B, { waitUntil: 'networkidle' });
await r.waitForTimeout(1200);
for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) await r.keyboard.press(k);
await r.waitForTimeout(500);
const reduced = await r.evaluate(() => ({
	markers: document.querySelectorAll('.tp .target').length,
	rain: document.querySelectorAll('.rain span').length,
	canvas: !!document.querySelector('canvas.gl'),
	lens: !!document.querySelector('.lens'),
	fuji: !!document.querySelector('.fuji'),
	hiddenText: [...document.querySelectorAll('h1,h2,p,li,td')].filter((el) => {
		// intentional disclosures are [hidden]; that is a control, not a motion failure
		if (el.hasAttribute('hidden')) return false;
		const cs = getComputedStyle(el);
		return cs.opacity === '0' || cs.visibility === 'hidden' || el.getBoundingClientRect().height === 0;
	}).length
}));
await r.close();

// mobile: markers present, tap targets >= 44, no overflow
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(B, { waitUntil: 'networkidle' });
await m.waitForTimeout(1500);
const mobile = await m.evaluate(() => {
	const small = [...document.querySelectorAll('a,button,input')].filter((el) => {
		const x = el.getBoundingClientRect();
		return x.width > 0 && x.height > 0 && (x.height < 44 || x.width < 44);
	}).map((el) => `${el.tagName}:${Math.round(el.getBoundingClientRect().height)}:${(el.textContent || '').trim().slice(0, 16)}`);
	return {
		markers: document.querySelectorAll('.tp .target').length,
		smallTargets: small.length,
		small: small.slice(0, 5),
		overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
	};
});
await m.close();
await b.close();
console.log(JSON.stringify({ reduced, mobile }, null, 1));
