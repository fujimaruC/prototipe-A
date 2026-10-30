import { chromium } from 'playwright';

const BASE = 'http://localhost:4400';
const b = await chromium.launch();
const out = [];
const log = (ok, name, extra = '') =>
	out.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);

// --- desktop flows
{
	const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
	const p = await ctx.newPage();
	const errs = [];
	p.on('pageerror', (e) => errs.push(e.message));
	await p.goto(BASE + '/', { waitUntil: 'networkidle' });

	// jump index via "/"
	await p.keyboard.press('/');
	await p
		.waitForSelector('[role="dialog"]', { timeout: 3000 })
		.then(() => log(true, 'index opens on /'))
		.catch(() => log(false, 'index opens on /'));
	await p.keyboard.type('rec');
	await p.waitForTimeout(150);
	const opts = await p.locator('[role="option"]').allInnerTexts();
	const labels = opts.map((o) => o.split('\n')[1] ?? o);
	log(
		opts.length === 2 && labels.includes('Record') && labels.includes('Case files'),
		'index filters',
		labels.join(' | '),
	);
	await p.keyboard.press('Escape');
	await p.waitForTimeout(200);
	log((await p.locator('[role="dialog"]').count()) === 0, 'index closes on Escape');

	// empty state
	await p.keyboard.press('/');
	await p.keyboard.type('zzzz');
	await p.waitForTimeout(120);
	const empty = await p.locator('.empty').count();
	log(empty === 1, 'index empty state');
	await p.locator('.reset').click();
	log((await p.locator('[role="option"]').count()) === 5, 'index reset restores rows');
	await p.keyboard.press('Escape');
	await p.waitForTimeout(250);
	log((await p.locator('[role="dialog"]').count()) === 0, 'escape works after focus loss');

	// negative mode
	const before = await p.evaluate(() =>
		getComputedStyle(document.documentElement).getPropertyValue('--ground').trim(),
	);
	await p.getByRole('button', { name: /Positive|Negative/ }).click();
	await p.waitForTimeout(450);
	const after = await p.evaluate(() => ({
		ground: getComputedStyle(document.documentElement).getPropertyValue('--ground').trim(),
		attr: document.documentElement.dataset.mode,
	}));
	log(
		before !== after.ground && after.attr === 'negative',
		'negative mode swaps ground',
		`${before} -> ${after.ground}`,
	);
	await p.reload({ waitUntil: 'networkidle' });
	const persisted = await p.evaluate(() => document.documentElement.dataset.mode);
	log(persisted === 'negative', 'negative mode persists across reload');
	await p.getByRole('button', { name: /Positive|Negative/ }).click();
	await p.waitForTimeout(400);

	// case file expand
	const row = p.locator('.row').first();
	await row.locator('.summary').click();
	await p.waitForTimeout(450);
	log((await row.getAttribute('class'))?.includes('open'), 'case file expands');
	const panelText = await row.locator('.panel-inner').innerText();
	log(panelText.length > 20, 'panel has content', `${panelText.length} chars`);
	await row.locator('.summary').click();
	await p.waitForTimeout(450);
	log(!(await row.getAttribute('class'))?.includes('open'), 'case file collapses');

	// test point: wrong then right
	await p.locator('#tp-input').fill('CKT{not_a_real_flag}');
	await p.locator('button[type="submit"]').click();
	await p.waitForTimeout(400);
	const msg = await p.locator('#tp-msg').innerText();
	log(/does not match/i.test(msg), 'wrong token rejected', msg);
	await p.locator('#tp-input').fill('CKT{tr4ce_the_p4th}');
	await p.locator('button[type="submit"]').click();
	await p.waitForTimeout(500);
	const msg2 = await p.locator('#tp-msg').innerText();
	log(/traced/i.test(msg2), 'correct token accepted', msg2);
	const bars = await p.locator('.bars .bar.on').count();
	log(bars === 1, 'progress bar updates', `${bars} lit`);

	// duplicate
	await p.locator('#tp-input').fill('CKT{tr4ce_the_p4th}');
	await p.locator('button[type="submit"]').click();
	await p.waitForTimeout(400);
	log(/already/i.test(await p.locator('#tp-msg').innerText()), 'duplicate detected');

	// tab nav moves focus to section
	await p.locator('.rail a').nth(2).click();
	await p.waitForTimeout(900);
	const focused = await p.evaluate(() => document.activeElement?.id ?? '');
	log(focused === 'record', 'tab click focuses section', focused);

	// konami
	await p.evaluate(() => window.scrollTo(0, 0));
	for (const k of [
		'ArrowUp',
		'ArrowUp',
		'ArrowDown',
		'ArrowDown',
		'ArrowLeft',
		'ArrowRight',
		'ArrowLeft',
		'ArrowRight',
		'b',
		'a',
	])
		await p.keyboard.press(k);
	await p.waitForTimeout(120);
	log((await p.locator('.frame.glitch').count()) === 1, 'konami triggers glitch');
	await p.waitForTimeout(1600);

	log(errs.length === 0, 'no page errors', errs.join('; '));
	await ctx.close();
}

// --- gated route, all six points
{
	const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
	const p = await ctx.newPage();
	await p.goto(BASE + '/', { waitUntil: 'networkidle' });
	await p.goto(BASE + '/secret', { waitUntil: 'networkidle' });
	log((await p.locator('.locked').count()) === 1, 'secret locked without points');

	await p.goto(BASE + '/', { waitUntil: 'networkidle' });
	const tokens = [
		'CKT{tr4ce_the_p4th}',
		'CKT{0hm_sw33p}',
		'CKT{p4tch_sch3dule}',
		'CKT{sh13ld_w4ll}',
		'CKT{d0cum3nt_1t}',
		'CKT{wh0_1s_answ3r1ng}',
	];
	for (const t of tokens) {
		await p.locator('#tp-input').fill(t);
		await p.locator('button[type="submit"]').click();
		await p.waitForTimeout(320);
	}
	await p.waitForTimeout(1200);
	const url = p.url();
	log(url.endsWith('/secret'), 'all six unlocks /secret', url);
	const open = await p.locator('.open').count();
	log(open === 1, 'secret content rendered');
	await ctx.close();
}

// --- storage-disabled resilience
{
	const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
	await ctx.addInitScript(() => {
		Object.defineProperty(window, 'sessionStorage', {
			get() {
				throw new Error('blocked');
			},
		});
	});
	const p = await ctx.newPage();
	const errs = [];
	p.on('pageerror', (e) => errs.push(e.message));
	await p.goto(BASE + '/', { waitUntil: 'networkidle' });
	await p.waitForTimeout(500);
	const h1 = await p.locator('h1').innerText();
	log(h1.toLowerCase().includes('jericho'), 'renders with storage blocked', h1.replace(/\n/g, ' '));
	log(errs.length === 0, 'no errors with storage blocked', errs.join('; '));
	await ctx.close();
}

await b.close();
console.log(out.join('\n'));
console.log('\nFAILS:', out.filter((l) => l.startsWith('FAIL')).length);
