import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
await p.goto('http://localhost:4400/prototipe-A/?quality=low', { waitUntil: 'networkidle' });
await p.waitForTimeout(3000);

const before = await p.evaluate(() => {
	const t = document.querySelector('.tp .target');
	const r = t?.getBoundingClientRect();
	const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
	return {
		exists: !!t,
		expanded: t?.getAttribute('aria-expanded'),
		rect: r ? { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null,
		topElementAtCenter: top ? `${top.tagName}.${top.className}`.slice(0, 60) : null,
		intercepted: top ? !t.contains(top) && top !== t : null
	};
});

// click via real pointer, then read again
const r = before.rect;
if (r) await p.mouse.click(r.l + r.w / 2, r.t + r.h / 2);
await p.waitForTimeout(400);
const after = await p.evaluate(() => {
	const t = document.querySelector('.tp .target');
	const h = document.querySelector('.tp .hint');
	return {
		expanded: t?.getAttribute('aria-expanded'),
		hintHidden: h?.hasAttribute('hidden'),
		hintText: h?.textContent?.trim().slice(0, 40)
	};
});
console.log(JSON.stringify({ before, after }, null, 1));
await b.close();
