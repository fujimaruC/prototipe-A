import { chromium, devices } from 'playwright';
const B = 'http://localhost:4400/prototipe-A/';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

const d = await b.newPage({ viewport: { width: 1394, height: 723 } });
await d.goto(B + '?quality=high', { waitUntil: 'networkidle' });
await d.waitForTimeout(3000);

// does the avatar animate at rest?
const frames = [];
for (let i = 0; i < 14; i++) {
	await d.waitForTimeout(400);
	frames.push(await d.evaluate(() => {
		const svg = document.querySelector('.fuji svg');
		return svg ? svg.innerHTML.length : 0;
	}));
}
const distinctFrames = new Set(frames).size;

// how visible is the field? sample the canvas for non-background pixels
const fieldInk = await d.evaluate(() => {
	const c = document.querySelector('.field canvas');
	if (!c) return null;
	const ctx = c.getContext('2d');
	const { data } = ctx.getImageData(0, 0, c.width, c.height);
	let lit = 0;
	for (let i = 3; i < data.length; i += 4) if (data[i] > 8) lit++;
	return { litPixels: lit, total: c.width * c.height, pct: +(lit / (c.width * c.height) * 100).toFixed(3) };
});

// is anything inviting a tap above the fold?
const invites = await d.evaluate(() => ({
	hint: document.querySelector('.hero-foot')?.textContent?.replace(/\s+/g, ' ').trim(),
	cursorHint: getComputedStyle(document.querySelector('.field') ?? document.body).cursor,
	fieldPointer: getComputedStyle(document.querySelector('.field') ?? document.body).pointerEvents
}));
await d.close();

// mobile: what extra affordances exist?
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const m = await ctx.newPage();
await m.goto(B, { waitUntil: 'networkidle' });
await m.waitForTimeout(2600);
const mob = await m.evaluate(() => ({
	dockActs: document.querySelectorAll('.dock .act').length,
	hud: !!document.querySelector('.hud'),
	field: !!document.querySelector('.field canvas'),
	avatar: document.querySelectorAll('.fuji').length,
	// anything that only appears on mobile?
	mobileOnly: [...document.querySelectorAll('[class]')].filter((el) => {
		const cs = getComputedStyle(el);
		return cs.display !== 'none' && el.className && String(el.className).includes('dock');
	}).length
}));
await ctx.close();
await b.close();
console.log(JSON.stringify({ distinctFrames, fieldInk, invites, mob }, null, 1));
