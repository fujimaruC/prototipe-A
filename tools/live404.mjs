import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const bad = [];
p.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url().split('/').pop()}`); });
await p.goto('https://fujimaruC.github.io/prototipe-A/does-not-exist', { waitUntil: 'networkidle', timeout: 45000 });
await p.waitForTimeout(1500);
const s = await p.evaluate(() => ({
	h1: document.querySelector('h1')?.innerText.replace(/\n/g, ' '),
	err: document.querySelector('.code')?.innerText,
	js: !!document.querySelector('h1'),
}));
await p.screenshot({ path: '.shots/pages-404.png' });
console.log(JSON.stringify({ s, bad: bad.filter((x) => !x.startsWith('404 does')) }, null, 2));
await b.close();
