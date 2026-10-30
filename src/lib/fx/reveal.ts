/**
 * Section reveals: three layers, one clock, one easing family.
 *
 * Primary   the heading wipes in along its own baseline (clip-path, not opacity)
 * Secondary the rule under the heading draws left to right (scaleX)
 * Ambient   the section's meta line settles 60 ms later
 *
 * Everything runs on ScrollTrigger, which shares GSAP's ticker with the driver, so this adds
 * no second loop.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './env';

const EASE = 'power3.out';
const SHUT = 'power2.in';

export function initReveals(): () => void {
	if (prefersReducedMotion()) return () => {};

	gsap.registerPlugin(ScrollTrigger);
	const ctx = gsap.context(() => {
		for (const section of document.querySelectorAll<HTMLElement>('[data-reveal]')) {
			const head = section.querySelector<HTMLElement>('[data-reveal-head]');
			const rule = section.querySelector<HTMLElement>('[data-reveal-rule]');
			const meta = section.querySelector<HTMLElement>('[data-reveal-meta]');

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: section,
					start: 'top 82%',
					once: true,
					invalidateOnRefresh: true
				}
			});

			if (head) {
				tl.fromTo(
					head,
					{ clipPath: 'inset(0 100% 0 0)', x: -8 },
					{ clipPath: 'inset(0 0% 0 0)', x: 0, duration: 0.38, ease: EASE }
				);
			}
			if (rule) {
				tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.42, ease: EASE, transformOrigin: 'left' }, 0.06);
			}
			if (meta) {
				tl.fromTo(meta, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, ease: EASE }, 0.12);
			}
		}
	});

	return () => ctx.revert();
}

/**
 * Scroll-velocity skew on display type. Decays to zero within ~300 ms of the wheel stopping,
 * capped at 2.5deg so it reads as paper flexing, not as the layout breaking.
 */
export function initVelocitySkew(): () => void {
	if (prefersReducedMotion()) return () => {};

	const targets = [...document.querySelectorAll<HTMLElement>('[data-skew]')];
	if (targets.length === 0) return () => {};

	let velocity = 0;
	let raf = 0;
	let last = 0;

	const quick = targets.map((el) => ({
		el,
		skew: gsap.quickTo(el, 'skewY', { duration: 0.3, ease: 'power2.out' })
	}));

	const st = ScrollTrigger.create({
		onUpdate: (self) => {
			velocity = self.getVelocity();
		}
	});

	const tick = (time: number) => {
		const dt = Math.min(50, time - last);
		last = time;
		// map px/s to degrees, then let it decay
		const target = gsap.utils.clamp(-2.5, 2.5, velocity / 900);
		velocity *= 0.9;
		for (const q of quick) q.skew(target);
		raf = requestAnimationFrame(tick);
	};
	raf = requestAnimationFrame(tick);

	return () => {
		cancelAnimationFrame(raf);
		st.kill();
	};
}

/** Smooth in-page navigation used by the rail, the index and the bottom strip. */
export function goToSection(id: string): void {
	const el = document.getElementById(id);
	if (!el) return;
	el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
	el.setAttribute('tabindex', '-1');
	el.focus({ preventScroll: true });
}

export { SHUT };
