/**
 * Fujimaru's movement. One job: decide where the sprite is, and how it got there.
 *
 * The sprite lives in document coordinates (absolute, not fixed) so scrolling moves it for
 * free and it never needs per-frame repositioning. Only two things run per frame: the idle
 * look-at and an in-flight walk or throw.
 *
 * Everything that changes position uses GSAP tweens, so it shares the single ticker.
 */

import { gsap } from 'gsap';
import { onFrame, snapshot } from '$lib/fx/driver';
import { prefersReducedMotion } from '$lib/fx/env';

export type Mood = 'idle' | 'walk' | 'portalOut' | 'portalIn' | 'sit' | 'react' | 'drag' | 'fall';

export interface Platform {
	el: HTMLElement;
	/** Document-space top edge, where the feet go. */
	top: number;
	left: number;
	right: number;
}

export interface CharacterOptions {
	el: HTMLElement;
	/** Sprite is 24px tall; scale 2 puts it at 48px. */
	scale?: number;
	onMood?: (m: Mood) => void;
	onLand?: (platform: Platform) => void;
	/** Fired whenever the sprite comes to rest, including when the page scrolls under it. */
	onSettle?: (platform: Platform) => void;
}

export interface CharacterHandle {
	destroy: () => void;
	summon: () => void;
	platforms: () => Platform[];
}

const SCROLL_SETTLE_MS = 400;

interface Rect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/** Document-space rects of everything that carries text. Cached per platform read. */
let textRects: Rect[] = [];

function cacheTextRects(): void {
	const vw = window.scrollX;
	const vh = window.scrollY;
	textRects = [];
	for (const node of document.querySelectorAll<HTMLElement>('p, li, td, th, h1, h2, h3, a, button, dd, dt')) {
		if (node.closest('.fuji')) continue;
		const r = node.getBoundingClientRect();
		if (r.width < 2 || r.height < 2) continue;
		textRects.push({
			left: r.left + vw,
			top: r.top + vh,
			right: r.right + vw,
			bottom: r.bottom + vh
		});
	}
}

function countCollisions(x: number, y: number, w: number, h: number): number {
	const pad = 2;
	let n = 0;
	for (const r of textRects) {
		if (x + w - pad < r.left || x + pad > r.right || y + h - pad < r.top || y + pad > r.bottom) continue;
		n++;
	}
	return n;
}

function collides(x: number, y: number, w: number, h: number): boolean {
	const pad = 2;
	for (const r of textRects) {
		if (x + w - pad < r.left || x + pad > r.right || y + h - pad < r.top || y + pad > r.bottom) continue;
		return true;
	}
	return false;
}

/**
 * Candidate x positions on a platform's top edge, best first. Returns null when every
 * candidate covers text, which is what keeps the sprite off the copy.
 */
function safeSpot(p: Platform): { x: number; valid: boolean } {
	const y = p.top - 48;
	const width = p.right - p.left;
	const candidates = [
		p.left + 8,
		p.right - 48 - 8,
		p.left + Math.max(0, (width - 48) / 2)
	];
	for (const cx of candidates) {
		if (cx < 0) continue;
		if (!collides(cx, y, 48, 48)) return { x: cx, valid: true };
	}
	return { x: candidates[0] ?? p.left, valid: false };
}

function readPlatforms(scale: number): Platform[] {
	cacheTextRects();
	const out: Platform[] = [];
	for (const el of document.querySelectorAll<HTMLElement>('[data-platform]')) {
		const r = el.getBoundingClientRect();
		if (r.width < 24 || r.height === 0) continue;
		const p: Platform = {
			el,
			top: r.top + window.scrollY,
			left: r.left + window.scrollX,
			right: r.right + window.scrollX
		};
		if (!safeSpot(p).valid) continue;
		out.push(p);
	}
	return out;
}

export function createCharacter({
	el,
	scale = 2,
	onMood,
	onLand,
	onSettle
}: CharacterOptions): CharacterHandle {
	const spriteW = 24 * scale;
	const spriteH = 24 * scale;

	let platforms = readPlatforms(scale);
	let current: Platform | null = null;
	let x = 0;
	let y = 0;
	let mood: Mood = 'idle';
	let settleTimer = 0;
	let dragging = false;
	let dragOffset = { x: 0, y: 0 };
	let lastPointer = { x: 0, y: 0, t: 0 };
	let flight: gsap.core.Tween | null = null;
	let blinkTimer = 0;
	let visible = true;
	let wasMoving = false;

	const setMood = (m: Mood) => {
		if (mood === m) return;
		mood = m;
		onMood?.(m);
	};

	/**
	 * GSAP owns the transform. Writing `style.transform` directly while a scale/opacity tween is
	 * running makes the two fight, which snapped the sprite to the origin mid-portal.
	 */
	const place = (nx: number, ny: number, immediate = true) => {
		x = nx;
		y = ny;
		if (immediate) gsap.set(el, { x: nx, y: ny });
	};

	/** Feet sit on the platform's top edge, at the first x that covers no text. */
	const standOn = (p: Platform) => {
		current = p;
		const spot = safeSpot(p);
		place(spot.x, p.top - spriteH);
		onSettle?.(p);
	};

	const nearest = (): Platform | null => {
		if (platforms.length === 0) return null;
		const vh = window.innerHeight;
		const top = window.scrollY;
		const bottom = top + vh;
		const centre = top + vh * 0.5;

		// Clearance under the chrome: the sprite must not stand against the status bar, or its
		// bubble is pushed off-screen above it. Also keep it out of the top quarter, which is
		// heading/metadata territory — a heading ledge there put the sprite over the copy.
		const chrome = document.querySelector('.chrome-wrap')?.getBoundingClientRect();
		const safeTop = Math.max(
			top + (chrome ? chrome.bottom : 0) + spriteH + 56,
			top + vh * 0.25
		);

		const score = (p: Platform) => Math.abs(p.top - centre);

		let best: Platform | null = null;
		let bestScore = Infinity;
		for (const p of platforms) {
			if (p.top < safeTop || p.top > bottom - 8) continue;
			const s = score(p);
			if (s < bestScore) {
				bestScore = s;
				best = p;
			}
		}
		return best;
	};

	const dent = (p: Platform) => {
		gsap.fromTo(
			p.el,
			{ y: 0 },
			{ y: 3, duration: 0.09, yoyo: true, repeat: 1, ease: 'power2.out', clearProps: 'y' }
		);
	};

	const walkTo = (p: Platform) => {
		setMood('walk');
		const tx = p.left + Math.min(spriteW, (p.right - p.left) * 0.25);
		const ty = p.top - spriteH;
		const dist = Math.hypot(tx - x, ty - y);
		flight?.kill();
		flight = gsap.to(
			{ x, y },
			{
				x: tx,
				y: ty,
				duration: gsap.utils.clamp(0.35, 1.1, dist / 900),
				ease: 'power2.inOut',
				onUpdate() {
					const self = this.targets()[0] as { x: number; y: number };
					place(self.x, self.y);
				},
				onComplete() {
					current = p;
					setMood('idle');
					dent(p);
					onLand?.(p);
				}
			}
		);
	};

	const portalTo = (p: Platform) => {
		setMood('portalOut');
		const tx = p.left + Math.min(spriteW, (p.right - p.left) * 0.25);
		const ty = p.top - spriteH;
		const ring = document.createElement('span');
		ring.className = 'portal-ring';
		ring.setAttribute('aria-hidden', 'true');
		Object.assign(ring.style, {
			position: 'absolute',
			left: `${x + spriteW / 2}px`,
			top: `${y + spriteH / 2}px`,
			width: '0px',
			height: '0px',
			borderRadius: '50%',
			border: '2px solid var(--accent)',
			transform: 'translate(-50%, -50%)',
			pointerEvents: 'none',
			zIndex: '2'
		} as CSSStyleDeclaration);
		document.body.appendChild(ring);

		gsap.to(ring, {
			width: spriteW * 2.2,
			height: spriteW * 2.2,
			opacity: 0,
			duration: 0.5,
			ease: 'power2.out',
			onComplete: () => ring.remove()
		});
		gsap.to(el, {
			scale: 0.2,
			opacity: 0,
			duration: 0.22,
			ease: 'power2.in',
			onComplete: () => {
				place(tx, ty);
				setMood('portalIn');
				gsap.fromTo(
					el,
					{ scale: 0.2, opacity: 0 },
					{
						scale: 1,
						opacity: 1,
						duration: 0.26,
						ease: 'back.out(2)',
						onComplete: () => {
							current = p;
							setMood('idle');
							dent(p);
							onLand?.(p);
						}
					}
				);
			}
		});
	};

	const travel = (p: Platform | null) => {
		if (!p) return;
		const tx = p.left + Math.min(spriteW, (p.right - p.left) * 0.25);
		const ty = p.top - spriteH;
		const dist = Math.hypot(tx - x, ty - y);
		if (dist < 220) walkTo(p);
		else portalTo(p);
	};

	/** After scrolling stops, settle onto the best platform in view. */
	/**
	 * Centre the sprite in the stage without covering copy. A fixed x landed on the hero's
	 * alias text; scan outward from the centre for a column that is clear, and only fall back
	 * to the centre if every candidate is occupied.
	 */
	const centreInStage = () => {
		// Cache before any scan: both branches score against textRects, and an empty cache
		// reports every position as clear.
		cacheTextRects();
		const y = window.scrollY + window.innerHeight * 0.5 - spriteH / 2;

		/*
		 * Narrow screens: the name spans the column and the copy fills everything under it, so
		 * any fixed offset lands on text. Scan the viewport for the emptiest spot instead,
		 * scoring the sprite box and the bubble box together, and preferring the lower half so
		 * the avatar sits near the dock rather than over the headline.
		 */
		if (window.innerWidth < 768) {
			const slot = document.querySelector<HTMLElement>('.fuji-slot');
			if (slot) {
				const r = slot.getBoundingClientRect();
				// feet on the slot's bottom edge, right-aligned inside it
				const sx = r.right - spriteW - 12;
				const sy = r.bottom + window.scrollY - spriteH - 8;
				place(sx, sy);
				return;
			}
			const BUBBLE_H = 34;
			const GAP = 8;
			const main = document.querySelector('main')?.getBoundingClientRect();
			const minX = (main?.left ?? 0) + 8;
			const maxX = (main?.right ?? window.innerWidth) - spriteW - 8;
			const chrome = document.querySelector('.chrome-wrap')?.getBoundingClientRect();
			const minY = window.scrollY + (chrome?.bottom ?? 0) + BUBBLE_H + GAP;
			const maxY = window.scrollY + window.innerHeight - spriteH - 80;

			let bestX = minX;
			let bestY = minY;
			let bestScore = Infinity;
			for (let ty = maxY; ty >= minY; ty -= 24) {
				for (let tx = minX; tx <= maxX; tx += 24) {
					const overlap =
						countCollisions(tx, ty, spriteW, spriteH) +
						countCollisions(tx, ty - BUBBLE_H - GAP, spriteW, BUBBLE_H);
					// lower is better on a phone: keep the avatar away from the headline
					const score = overlap * 1000 - ty * 0.01;
					if (score < bestScore) {
						bestScore = score;
						bestX = tx;
						bestY = ty;
					}
				}
			}
			place(bestX, bestY);
			return;
		}
		const midX = window.innerWidth * 0.5 - spriteW / 2;
		// the bubble sits above the sprite, so score both boxes
		const bubbleH = 44;
		const overlapCount = (x: number) =>
			countCollisions(x, y, spriteW, spriteH) + countCollisions(x, y - bubbleH, spriteW, bubbleH);

		// Stay inside the sheet's content column, never the viewport margin: an unbounded scan
		// parked the sprite in the right gutter, outside the drawing.
		const main = document.querySelector('main')?.getBoundingClientRect();
		const minX = main ? main.left + 8 : 8;
		const maxX = main ? main.right - spriteW - 8 : window.innerWidth - spriteW - 8;
		const centreX = (minX + maxX) / 2;

		// Pick the column with the least overlap, preferring the centre on ties.
		let bestX = centreX;
		let bestScore = Infinity;
		for (let x = minX; x <= maxX; x += 24) {
			const overlap = overlapCount(x);
			const score = overlap * 1000 + Math.abs(x - centreX) / 10;
			if (score < bestScore) {
				bestScore = score;
				bestX = x;
			}
		}
		place(bestX, y);
	};

	const sectionAtCentre = (): HTMLElement | null => {
		const mid = window.scrollY + window.innerHeight * 0.5;
		let best: HTMLElement | null = null;
		let bestDist = Infinity;
		for (const s of document.querySelectorAll<HTMLElement>('section[id], header[id]')) {
			const r = s.getBoundingClientRect();
			const top = r.top + window.scrollY;
			const bottom = r.bottom + window.scrollY;
			if (mid < top || mid > bottom) continue;
			const d = Math.abs(mid - (top + bottom) / 2);
			if (d < bestDist) {
				bestDist = d;
				best = s;
			}
		}
		return best;
	};

	const onScrollSettled = () => {
		if (dragging || mood === 'walk' || mood === 'portalOut' || mood === 'portalIn') return;
		if (window.innerWidth < 768) {
			centreInStage();
			const sec = sectionAtCentre();
			if (sec) onSettle?.({ el: sec, top: 0, left: 0, right: 0 });
			return;
		}
		const p = nearest();
		if (!p) {
			// Nothing worth standing on in view: hold the vertical centre of the stage.
			centreInStage();
			const sec = sectionAtCentre();
			if (sec) onSettle?.({ el: sec, top: 0, left: 0, right: 0 });
			return;
		}
		if (current && current.el === p.el) {
			// same platform: just re-seat, the page moved under us
			standOn(p);
			return;
		}
		travel(p);
	};

	const onFrameStop = onFrame((s) => {
		// idle look-at: shift the visor 1px toward the cursor
		if (mood === 'idle' && s.active && visible) {
			const dx = Math.sign(s.px + window.scrollX - (x + spriteW / 2));
			const dy = Math.sign(s.py + window.scrollY - (y + spriteH / 2));
			el.style.setProperty('--look-x', `${dx}px`);
			el.style.setProperty('--look-y', `${dy}px`);
		}

		const moving = Math.abs(s.velocity) > 0.4;
		if (moving) {
			wasMoving = true;
			window.clearTimeout(settleTimer);
		} else if (wasMoving) {
			// velocity has returned to zero after a scroll: settle once, after a short pause
			wasMoving = false;
			window.clearTimeout(settleTimer);
			settleTimer = window.setTimeout(onScrollSettled, SCROLL_SETTLE_MS);
		}
	});

	// initial placement, then once more after webfonts settle the layout
	const first = nearest();
	(window as Window & { __charDebug?: unknown }).__charDebug = {
		platforms: platforms.length,
		firstFound: !!first,
		firstTop: first ? Math.round(first.top) : null,
		chromeBottom: Math.round(
			document.querySelector('.chrome-wrap')?.getBoundingClientRect().bottom ?? 0
		),
		vh: window.innerHeight
	};
	if (window.innerWidth < 768) {
		// Phone: the scan owns placement. A ledge here sits on top of the copy.
		centreInStage();
		const sec = sectionAtCentre();
		if (sec) onSettle?.({ el: sec, top: 0, left: 0, right: 0 });
	} else if (first) {
		standOn(first);
	} else {
		// No platform qualifies (nothing in view clears the chrome and the top quarter).
		// Centre in the stage via the collision-aware helper, and still report the section so
		// the dialogue stays attached to the character.
		centreInStage();
		const sec = sectionAtCentre();
		if (sec) onSettle?.({ el: sec, top: 0, left: 0, right: 0 });
	}

	if (document.fonts?.ready) {
		void document.fonts.ready.then(() => {
			platforms = readPlatforms(scale);
			// Phones never stand on a ledge: the scan owns placement, and re-seating here was
			// what put the sprite back on the alias block after it had been placed correctly.
			if (window.innerWidth < 768) {
				centreInStage();
				return;
			}
			const settled = nearest();
			if (settled) standOn(settled);
		});
	}

	// blink
	const blink = () => {
		if (mood === 'idle') {
			el.classList.add('blink');
			window.setTimeout(() => el.classList.remove('blink'), 130);
		}
		blinkTimer = window.setTimeout(blink, 2400 + Math.random() * 3600);
	};
	blinkTimer = window.setTimeout(blink, 1800);

	// platforms move when fonts load, panels open, the window resizes
	const ro = new ResizeObserver(() => {
		platforms = readPlatforms(scale);
		if (window.innerWidth < 768) {
			centreInStage();
			return;
		}
		if (current) {
			const match = platforms.find((p) => p.el === current?.el);
			if (match) standOn(match);
		}
	});
	ro.observe(document.body);

	const io = new IntersectionObserver((entries) => {
		visible = entries.some((e) => e.isIntersecting);
	});
	io.observe(el);

	return {
		destroy() {
			onFrameStop();
			window.clearTimeout(settleTimer);
			window.clearTimeout(blinkTimer);
			flight?.kill();
			ro.disconnect();
			io.disconnect();
		},
		summon() {
			platforms = readPlatforms(scale);
			travel(nearest());
		},
		platforms: () => platforms
	};
}

export function characterEnabled(): boolean {
	if (typeof window === 'undefined') return false;
	if (prefersReducedMotion()) return false;
	// Phones keep the avatar: it is the page's personality, and touch gets the tap reactions.
	return window.innerWidth >= 320;
}

export { snapshot };
