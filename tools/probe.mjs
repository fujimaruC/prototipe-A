import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 812 } });
await p.goto('http://localhost:4400/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const out = await p.evaluate(() => {
	const info = (sel) => {
		const el = document.querySelector(sel);
		if (!el) return { sel, missing: true };
		const cs = getComputedStyle(el);
		const r = el.getBoundingClientRect();
		return {
			sel,
			display: cs.display,
			flexDir: cs.flexDirection,
			pos: cs.position,
			w: Math.round(r.width),
			h: Math.round(r.height),
			overflowX: cs.overflowX,
			kids: el.children.length,
		};
	};
	const ul = document.querySelector('.rail ul');
	return {
		rail: info('.rail'),
		railUl: info('.rail ul'),
		railUlDisplay: ul ? getComputedStyle(ul).display : null,
		strip: info('.strip-wrap'),
		portstrip: info('.portstrip'),
		ports: [...document.querySelectorAll('.portstrip .port')].map((el) => {
			const r = el.getBoundingClientRect();
			return { w: Math.round(r.width), h: Math.round(r.height), text: el.textContent.trim().slice(0, 30) };
		}),
		emptyBoxes: [...document.querySelectorAll('div,li,span')]
			.filter((el) => {
				const r = el.getBoundingClientRect();
				const cs = getComputedStyle(el);
				return (
					r.width > 40 &&
					r.height > 20 &&
					r.height < 60 &&
					cs.borderTopWidth !== '0px' &&
					el.textContent.trim() === '' &&
					cs.position !== 'absolute'
				);
			})
			.slice(0, 8)
			.map((el) => ({
				cls: el.className,
				tag: el.tagName,
				h: Math.round(el.getBoundingClientRect().height),
			})),
		mediaMatch: window.matchMedia('(max-width: 767px)').matches,
		docW: document.documentElement.scrollWidth,
	};
});
console.log(JSON.stringify(out, null, 2));
await b.close();
