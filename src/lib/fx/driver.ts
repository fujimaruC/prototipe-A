/**
 * One clock. Scroll progress + pointer position are written here and read by every consumer.
 * No component adds its own scroll listener or RAF loop.
 */

import { clamp } from './env';

export interface DriverState {
	scroll: number; // 0..1 through the document
	y: number; // px
	px: number; // pointer x, viewport
	py: number; // pointer y, viewport
	active: boolean; // pointer is over the document
}

const state: DriverState = { scroll: 0, y: 0, px: -1, py: -1, active: false };
const listeners = new Set<(s: DriverState) => void>();
let started = false;
let raf = 0;

function measure(): void {
	const max = document.documentElement.scrollHeight - window.innerHeight;
	state.scroll = max > 0 ? clamp(window.scrollY / max) : 0;
	state.y = window.scrollY;
}

function frame(): void {
	measure();
	for (const fn of listeners) fn(state);
	raf = requestAnimationFrame(frame);
}

export function startDriver(): void {
	if (started || typeof window === 'undefined') return;
	started = true;
	window.addEventListener(
		'pointermove',
		(e) => {
			state.px = e.clientX;
			state.py = e.clientY;
			state.active = true;
		},
		{ passive: true },
	);
	document.addEventListener('pointerleave', () => {
		state.active = false;
	});
	measure();
	raf = requestAnimationFrame(frame);
}

export function stopDriver(): void {
	if (!started) return;
	started = false;
	cancelAnimationFrame(raf);
}

export function onFrame(fn: (s: DriverState) => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function snapshot(): DriverState {
	return state;
}
