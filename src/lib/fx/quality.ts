/**
 * Quality tiers. Detected once, then downgraded if the frame rate sags.
 * high  = full GL, heat layer at 1/2 res, cursor lens, character physics
 * medium= GL on, heat at 1/3 res, no cursor lens, simpler character
 * low   = no GL, no lens, static dither fallbacks
 */

export type Tier = 'high' | 'medium' | 'low';

const ORDER: Tier[] = ['low', 'medium', 'high'];

export function detectTier(): Tier {
	if (typeof window === 'undefined') return 'low';
	// `?quality=high|medium|low` pins the tier. Used by the visual QA harness, where software
	// GL would otherwise trip the FPS probe and downgrade every screenshot.
	const forced = new URLSearchParams(window.location.search).get('quality');
	if (forced === 'high' || forced === 'medium' || forced === 'low') return forced;
	const coarse = window.matchMedia('(pointer: coarse)').matches;
	const narrow = window.matchMedia('(max-width: 767px)').matches;
	const cores = navigator.hardwareConcurrency ?? 4;
	const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

	if (coarse || narrow) return cores >= 8 && !narrow ? 'medium' : 'low';
	if (cores <= 4 || mem <= 4) return 'medium';
	return 'high';
}

export function stepDown(tier: Tier): Tier {
	const i = ORDER.indexOf(tier);
	return ORDER[Math.max(0, i - 1)] ?? 'low';
}

export function canUseGl(tier: Tier): boolean {
	return tier !== 'low';
}

export function heatScale(tier: Tier): number {
	return tier === 'high' ? 0.5 : tier === 'medium' ? 0.34 : 0;
}
