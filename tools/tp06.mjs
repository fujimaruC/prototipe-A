import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:4400/prototipe-A/nope', { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);
const before = await p.evaluate(() => {
	const t = document.querySelector('.tp .target');
	const r = t?.getBoundingClientRect();
	const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
	return {
		exists: !!t,
		id: t?.querySelector('.id')?.textContent?.trim(),
		expanded: t?.getAttribute('aria-expanded'),
		h: r ? Math.round(r.height) : null,
		intercepted: top && t ? !t.contains(top) && top !== t : null
	};
});
const r = await p.evaluate(() => {
	const t = document.querySelector('.tp .target');
	const x = t.getBoundingClientRect();
	return { l: x.left + x.width / 2, t: x.top + x.height / 2 };
});
await p.mouse.click(r.l, r.t);
await p.waitForTimeout(350);
const after = await p.evaluate(() => {
	const t = document.querySelector('.tp .target');
	const h = document.querySelector('.tp .hint');
	return { expanded: t?.getAttribute('aria-expanded'), hint: h?.textContent?.trim().slice(0, 44), hidden: h?.hasAttribute('hidden') };
});
console.log(JSON.stringify({ before, after, errs: errs.slice(0, 2) }, null, 1));
await b.close();
