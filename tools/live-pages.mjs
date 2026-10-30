import { chromium } from 'playwright';
const URL = 'https://fujimaruC.github.io/prototipe-A/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const bad = [];
p.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
p.on('pageerror', (e) => bad.push(`JSERR ${e.message}`));
await p.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
await p.waitForTimeout(2000);
const s = await p.evaluate(() => ({
	h1: document.querySelector('h1')?.innerText.replace(/\n/g, ' '),
	fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
	headingSize: getComputedStyle(document.querySelector('h1')).fontSize,
	bg: getComputedStyle(document.body).backgroundColor,
	js: !!document.querySelector('.rail'),
	canonical: document.querySelector('link[rel=canonical]')?.href,
}));
await p.screenshot({ path: '.shots/pages-live.png' });
await p.goto(URL + 'secret/', { waitUntil: 'networkidle', timeout: 45000 });
const sec = await p.evaluate(() => document.querySelector('h1')?.innerText);
console.log(JSON.stringify({ s, sec, bad }, null, 2));
await b.close();
