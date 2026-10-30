import { chromium } from 'playwright';

const BASE = 'http://localhost:4400';
const b = await chromium.launch();

// negative mode
{
	const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
	await p.goto(BASE + '/', { waitUntil: 'networkidle' });
	await p.getByRole('button', { name: /Positive/ }).click();
	await p.waitForTimeout(500);
	await p.evaluate(() => window.scrollTo(0, 0));
	await p.screenshot({ path: '.shots/negative-fold.png' });
	await p.evaluate(() => window.scrollTo(0, 1800));
	await p.waitForTimeout(300);
	await p.screenshot({ path: '.shots/negative-cases.png' });
	await p.close();
}

// hover state on a primary target
{
	const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
	await p.goto(BASE + '/', { waitUntil: 'networkidle' });
	await p.hover('.cta');
	await p.waitForTimeout(300);
	await p.screenshot({ path: '.shots/hover-cta.png', clip: { x: 900, y: 360, width: 480, height: 130 } });
	await p.hover('.port');
	await p.waitForTimeout(400);
	await p.screenshot({ path: '.shots/hover-port.png', clip: { x: 100, y: 500, width: 1300, height: 200 } });
	await p.close();
}

// 404
{
	const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
	const res = await p.goto(BASE + '/nope', { waitUntil: 'networkidle' });
	console.log('404 status:', res?.status());
	console.log('404 body has error page:', (await p.content()).includes('No route'));
	await p.screenshot({ path: '.shots/404.png' });
	await p.close();
}

// reduced motion: is content all visible?
{
	const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
	await p.goto(BASE + '/', { waitUntil: 'networkidle' });
	await p.waitForTimeout(400);
	const hidden = await p.evaluate(() =>
		[...document.querySelectorAll('h1,h2,h3,p,li,td,th')]
			.filter((el) => {
				const cs = getComputedStyle(el);
				const r = el.getBoundingClientRect();
				return cs.opacity === '0' || cs.visibility === 'hidden' || r.height === 0;
			})
			.map((el) => el.tagName + ':' + el.textContent.trim().slice(0, 20)),
	);
	console.log('reduced-motion hidden text nodes:', hidden.length, hidden.slice(0, 5));
	const canvas = await p.locator('canvas').count();
	console.log('reduced-motion canvases:', canvas);
	await p.close();
}

// tap target audit on phone
{
	const p = await b.newPage({ viewport: { width: 375, height: 812 } });
	await p.goto(BASE + '/', { waitUntil: 'networkidle' });
	const small = await p.evaluate(() =>
		[...document.querySelectorAll('a,button,input')]
			.map((el) => {
				const r = el.getBoundingClientRect();
				return {
					tag: el.tagName,
					text: (el.textContent || el.getAttribute('placeholder') || '').trim().slice(0, 24),
					w: Math.round(r.width),
					h: Math.round(r.height),
					visible: r.width > 0 && r.height > 0,
				};
			})
			.filter((x) => x.visible && (x.h < 44 || x.w < 44)),
	);
	console.log('tap targets under 44px:', small.length);
	for (const s of small) console.log('  ', s.tag, s.w + 'x' + s.h, JSON.stringify(s.text));
	await p.close();
}

await b.close();
