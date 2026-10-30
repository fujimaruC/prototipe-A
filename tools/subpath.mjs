import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:4500/prototipe-A/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const failed = [];
p.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });
p.on('pageerror', (e) => failed.push(`JSERR ${e.message}`));
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);

const state = await p.evaluate(() => ({
	h1: document.querySelector('h1')?.innerText.replace(/\n/g, ' '),
	fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
	archivo: getComputedStyle(document.querySelector('h1')).fontFamily,
	headingSize: getComputedStyle(document.querySelector('h1')).fontSize,
	cssApplied: getComputedStyle(document.body).backgroundColor,
	jsRan: !!document.querySelector('.rail'),
}));
await p.screenshot({ path: '.shots/pages-subpath.png' });

// navigate to /secret via the app's own link
await p.goto(BASE + 'secret/', { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
const secret = await p.evaluate(() => ({
	heading: document.querySelector('h1')?.innerText,
	backLink: document.querySelector('a')?.getAttribute('href'),
}));
console.log(JSON.stringify({ state, secret, failed }, null, 2));
await b.close();
