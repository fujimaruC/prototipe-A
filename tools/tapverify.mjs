import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);

const frame = () => p.evaluate(() => document.querySelector('.fuji')?.getAttribute('data-frame'));
const pos = () => p.evaluate(() => { const f = document.querySelector('.fuji')?.getBoundingClientRect(); return f ? { l: Math.round(f.left), t: Math.round(f.top) } : null; });

const before = await pos();
const box = await p.locator('.fuji').boundingBox();
// single tap
await p.mouse.click(box.x + 24, box.y + 24);
await p.waitForTimeout(120);
const afterTap = await frame();
const posAfterTap = await pos();
await p.waitForTimeout(1100);

// double tap
await p.mouse.click(box.x + 24, box.y + 24);
await p.waitForTimeout(90);
await p.mouse.click(box.x + 24, box.y + 24);
await p.waitForTimeout(120);
const afterDouble = await frame();
await p.waitForTimeout(1100);

// real drag
const b2 = await p.locator('.fuji').boundingBox();
await p.mouse.move(b2.x + 24, b2.y + 24);
await p.mouse.down();
await p.mouse.move(b2.x + 200, b2.y + 120, { steps: 14 });
await p.mouse.up();
await p.waitForTimeout(900);
const afterDrag = await pos();

console.log(JSON.stringify({
	before, posAfterTap, afterDrag,
	movedOnTap: before && posAfterTap ? Math.abs(before.l - posAfterTap.l) + Math.abs(before.t - posAfterTap.t) : null,
	afterTap, afterDouble, errs: errs.slice(0, 3)
}, null, 1));
await b.close();
