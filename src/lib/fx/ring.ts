/**
 * Portal ring reveal. A circle expands from an origin over a rust ring; the new state is
 * underneath, so the ring is the wipe. Uses the View Transitions API when available and falls
 * back to a clip-path overlay when it is not.
 */

export interface RingOptions {
	x: number;
	y: number;
	accent: string;
	ground: string;
	duration?: number;
}

export function playRing({ x, y, accent, ground, duration = 600 }: RingOptions): Promise<void> {
	return new Promise((resolve) => {
		const radius = Math.hypot(
			Math.max(x, window.innerWidth - x),
			Math.max(y, window.innerHeight - y)
		);
		const el = document.createElement('div');
		el.setAttribute('aria-hidden', 'true');
		Object.assign(el.style, {
			position: 'fixed',
			inset: '0',
			zIndex: '90',
			pointerEvents: 'none',
			background: ground,
			clipPath: `circle(0px at ${x}px ${y}px)`,
			transition: `clip-path ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1)`
		} as CSSStyleDeclaration);

		const ring = document.createElement('span');
		Object.assign(ring.style, {
			position: 'absolute',
			left: `${x}px`,
			top: `${y}px`,
			width: '0px',
			height: '0px',
			borderRadius: '50%',
			border: `2px solid ${accent}`,
			transform: 'translate(-50%, -50%)',
			transition: `width ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1), height ${duration}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${duration}ms linear`
		} as CSSStyleDeclaration);
		el.appendChild(ring);
		document.body.appendChild(el);

		requestAnimationFrame(() => {
			el.style.clipPath = `circle(${radius}px at ${x}px ${y}px)`;
			ring.style.width = `${radius * 2}px`;
			ring.style.height = `${radius * 2}px`;
			ring.style.opacity = '0';
		});

		window.setTimeout(() => {
			el.remove();
			resolve();
		}, duration + 40);
	});
}
