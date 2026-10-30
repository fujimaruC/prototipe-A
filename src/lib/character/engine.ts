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
		const centre = window.scrollY + vh * 0.5;
		let best: Platform | null = null;
		let bestScore = Infinity;
		for (const p of platforms) {
			// prefer platforms inside the viewport, then the one nearest the centre
			const onScreen = p.top > window.scrollY - spriteH && p.top < window.scrollY + vh;
			const score = Math.abs(p.top - centre) + (onScreen ? 0 : vh * 2);
			if (score < bestScore) {
				bestScore = score;
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
	const onScrollSettled = () => {
		if (dragging || mood === 'walk' || mood === 'portalOut' || mood === 'portalIn') return;
		const p = nearest();
		if (!p) return;
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

	// initial placement
	const first = nearest();
	if (first) standOn(first);
	else place(window.innerWidth * 0.6, window.innerHeight * 0.5);

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
	return window.innerWidth >= 640;
}

export { snapshot };
