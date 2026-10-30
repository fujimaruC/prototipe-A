/**
 * One clock. GSAP's ticker is the only rAF loop in the app; Lenis is driven from it and the
 * GL layer renders from it. Components subscribe with onFrame() and never add their own loop.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { clamp } from './env';

export interface DriverState {
	scroll: number;
	y: number;
	px: number;
	py: number;
	active: boolean;
	velocity: number;
	time: number;
	delta: number;
}

const state: DriverState = {
	scroll: 0,
	y: 0,
	px: -1,
	py: -1,
	active: false,
	velocity: 0,
	time: 0,
	delta: 16.7
};
const listeners = new Set<(s: DriverState) => void>();
let started = false;
let lenis: Lenis | null = null;
let lastY = 0;
let lastT = 0;
let tick: ((time: number, delta: number) => void) | null = null;

function measure(): void {
	const max = document.documentElement.scrollHeight - window.innerHeight;
	state.scroll = max > 0 ? clamp(window.scrollY / max) : 0;
	state.y = window.scrollY;
}

export function startDriver(): void {
	if (started || typeof window === 'undefined') return;
	started = true;
	gsap.registerPlugin(ScrollTrigger);

	lenis = new Lenis({ autoRaf: false, duration: 1.05, smoothWheel: true });
	lenis.on('scroll', () => {
		ScrollTrigger.update();
	});

	window.addEventListener(
		'pointermove',
		(e) => {
			state.px = e.clientX;
			state.py = e.clientY;
			state.active = true;
		},
		{ passive: true }
	);
	document.addEventListener('pointerleave', () => {
		state.active = false;
	});

	measure();
	lastY = state.y;
	gsap.ticker.lagSmoothing(0);
	tick = (time: number, delta: number) => {
		lenis?.raf(time * 1000);
		measure();
		state.delta = delta;
		state.time = time;
		state.velocity = state.y - lastY;
		lastY = state.y;
		lastT = time;
		for (const fn of listeners) fn(state);
	};
	gsap.ticker.add(tick);
}

export function stopDriver(): void {
	if (!started) return;
	started = false;
	if (tick) gsap.ticker.remove(tick);
	lenis?.destroy();
	lenis = null;
}

export function getLenis(): Lenis | null {
	return lenis;
}

export function onFrame(fn: (s: DriverState) => void): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function snapshot(): DriverState {
	return state;
}

export function lastTime(): number {
	return lastT;
}
