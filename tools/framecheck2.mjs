import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:4400/prototipe-A/?quality=high', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);

const frames = [];
for (let i = 0; i < 24; i++) {
	await p.waitForTimeout(300);
	frames.push(await p.evaluate(() => document.querySelector('.fuji')?.getAttribute('data-frame') ?? null));
}

// tap the sprite
const box = await p.locator('.fuji').boundingBox();
if (box) {
	await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await p.waitForTimeout(150);
	var afterTap = await p.evaluate(() => document.querySelector('.fuji')?.getAttribute('data-frame'));
	await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
	await p.waitForTimeout(150);
	var afterDouble = await p.evaluate(() => document.querySelector('.fuji')?.getAttribute('data-frame'));
}
console.log(JSON.stringify({
	distinct: [...new Set(frames)],
	samples: frames.slice(0, 10),
	afterTap: typeof afterTap !== 'undefined' ? afterTap : null,
	afterDouble: typeof afterDouble !== 'undefined' ? afterDouble : null,
	errs: errs.slice(0, 3)
}, null, 1));
await b.close();
