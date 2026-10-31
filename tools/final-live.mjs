import { chromium, devices } from 'playwright';
const B = 'https://fujimaruC.github.io/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const d = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
d.on('pageerror', (e) => errs.push(e.message));
d.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 90)); });
await d.goto(B + '?quality=high', { waitUntil: 'networkidle', timeout: 60000 });
await d.waitForTimeout(4000);
const rect = await d.evaluate(() => {
	const c = document.querySelector('.field canvas')?.getBoundingClientRect();
	return c ? { l: c.left, t: c.top, w: c.width, h: c.height } : null;
});
for (let i = 0; i < 30; i++) {
	await d.evaluate(([x, y]) => window.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true })),
		[rect.l + 50 + ((i * 89) % Math.max(80, rect.w - 100)), rect.t + 200 + ((i * 61) % Math.max(80, rect.h - 300))]);
	await d.waitForTimeout(45);
}
await d.waitForTimeout(400);
const desk = await d.evaluate(() => {
	const g = JSON.parse(sessionStorage.getItem('nex.game') ?? '{}');
	return { packets: g.packets ?? 0, xp: g.xp ?? 0, level: g.level ?? 1, badges: (g.achievements ?? []).length, field: !!document.querySelector('.field canvas') };
});
await d.screenshot({ path: '.shots-p2/FINAL-desktop.png' });
await d.close();

const ctx = await b.newContext({ ...devices['iPhone 13'] });
const m = await ctx.newPage();
await m.goto(B, { waitUntil: 'networkidle', timeout: 60000 });
await m.waitForTimeout(2800);
const mBefore = await m.evaluate(() => ({ field: document.querySelectorAll('.field canvas').length, hint: [...document.querySelector('.hero-foot').children].filter((el) => getComputedStyle(el).display !== 'none').map((el) => el.textContent.trim().slice(0, 20)) }));
await m.tap('.dock .grab');
await m.waitForTimeout(300);
await m.tap('.dock .grab');
await m.waitForTimeout(300);
const mob = await m.evaluate(() => {
	const g = JSON.parse(sessionStorage.getItem('nex.game') ?? '{}');
	return { packets: g.packets ?? 0, xp: g.xp ?? 0, dock: !!document.querySelector('.dock'), avatar: document.querySelectorAll('.fuji').length };
});
await m.screenshot({ path: '.shots-p2/FINAL-mobile.png' });
await ctx.close();
await b.close();
console.log(JSON.stringify({ desk, mBefore, mob, errs: errs.slice(0, 3) }, null, 1));
