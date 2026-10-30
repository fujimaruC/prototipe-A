/** Environment probes, evaluated once on the client. */

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return true;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isFinePointer(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export const clamp = (v: number, min = 0, max = 1): number => Math.min(max, Math.max(min, v));
