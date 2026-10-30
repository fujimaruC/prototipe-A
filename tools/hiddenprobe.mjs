import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 }, reducedMotion: 'reduce' });
await p.goto('http://localhost:4400/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const out = await p.evaluate(() =>
	[...document.querySelectorAll('h1,h2,p,li,td')]
		.filter((el) => {
			const cs = getComputedStyle(el);
			return cs.opacity === '0' || cs.visibility === 'hidden' || el.getBoundingClientRect().height === 0;
		})
		.map((el) => ({
			tag: el.tagName,
			cls: el.className,
			hiddenAttr: el.hasAttribute('hidden'),
			display: getComputedStyle(el).display,
			text: (el.textContent || '').trim().slice(0, 30)
		}))
);
console.log(JSON.stringify(out, null, 1));
await b.close();
