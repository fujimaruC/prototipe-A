import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://127.0.0.1:5173/prototipe-A/?quality=low', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
const before = await p.evaluate(() => {
	const pin = document.querySelector('.pin');
	const track = document.querySelector('.track');
	const rec = document.getElementById('record');
	const r = (el) => { const x = el.getBoundingClientRect(); return { t: Math.round(x.top), h: Math.round(x.height), w: Math.round(x.width) }; };
	return {
		rec: rec ? r(rec) : null,
		pin: pin ? r(pin) : null,
		track: track ? { ...r(track), scrollW: track.scrollWidth, x: getComputedStyle(track).transform } : null,
		stops: document.querySelectorAll('.stop').length,
		bodyH: document.body.scrollHeight
	};
});
await p.evaluate(() => document.getElementById('record').scrollIntoView());
await p.waitForTimeout(1200);
const after = await p.evaluate(() => {
	const pin = document.querySelector('.pin');
	const track = document.querySelector('.track');
	const r = (el) => { const x = el.getBoundingClientRect(); return { t: Math.round(x.top), h: Math.round(x.height), w: Math.round(x.width) }; };
	return {
		scrollY: Math.round(window.scrollY),
		pin: pin ? r(pin) : null,
		track: track ? { ...r(track), x: getComputedStyle(track).transform } : null,
		pinSpacer: document.querySelector('.pin-spacer') ? r(document.querySelector('.pin-spacer')) : null
	};
});
console.log(JSON.stringify({ before, after }, null, 2));
await b.close();
