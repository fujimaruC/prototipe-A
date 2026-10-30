import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:4400/', { waitUntil: 'networkidle' });
await p.locator('#cases').scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.locator('.row').first().locator('.summary').click();
await p.waitForTimeout(700);
const box = await p.locator('.row').first().boundingBox();
await p.screenshot({
	path: '.shots/panel-open.png',
	clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 600) },
});
const h = await p
	.locator('.row')
	.first()
	.locator('.panel')
	.evaluate((el) => el.getBoundingClientRect().height);
console.log('panel height after open:', Math.round(h));
await p.locator('.row').first().locator('.summary').click();
await p.waitForTimeout(600);
const h2 = await p
	.locator('.row')
	.first()
	.locator('.panel')
	.evaluate((el) => el.getBoundingClientRect().height);
console.log('panel height after close:', Math.round(h2));
// rapid interrupt
await p.locator('.row').first().locator('.summary').click();
await p.waitForTimeout(80);
await p.locator('.row').first().locator('.summary').click();
await p.waitForTimeout(700);
const h3 = await p
	.locator('.row')
	.first()
	.locator('.panel')
	.evaluate((el) => el.getBoundingClientRect().height);
console.log('panel height after rapid toggle:', Math.round(h3));
await b.close();
