import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1394, height: 723 } });
const bad = [];
p.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
await p.goto('http://localhost:4400/prototipe-A/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
console.log(JSON.stringify({ bad: bad.slice(0, 8) }, null, 2));
await b.close();
