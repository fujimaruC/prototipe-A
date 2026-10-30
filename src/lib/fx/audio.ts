/**
 * Opt-in UI ticks. Web Audio only, created on first user gesture. Never autoplays.
 */

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (ctx) return ctx;
	const Ctor =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!Ctor) return null;
	try {
		ctx = new Ctor();
	} catch {
		return null;
	}
	return ctx;
}

export type Sound = 'tap' | 'open' | 'found' | 'scratch' | 'hover' | 'chime' | 'portal';

export function tick(kind: Sound = 'tap'): void {
	const ac = context();
	if (!ac) return;
	if (ac.state === 'suspended') void ac.resume();
	const now = ac.currentTime;
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	const spec: Record<Sound, { f: number; d: number; type: OscillatorType; gain: number; sweep?: number }> = {
		tap: { f: 220, d: 0.045, type: 'square', gain: 0.06 },
		hover: { f: 330, d: 0.028, type: 'square', gain: 0.03 },
		open: { f: 320, d: 0.07, type: 'square', gain: 0.05 },
		found: { f: 880, d: 0.18, type: 'square', gain: 0.06, sweep: 1.5 },
		chime: { f: 1320, d: 0.26, type: 'triangle', gain: 0.05, sweep: 1.25 },
		scratch: { f: 90, d: 0.02, type: 'sawtooth', gain: 0.025 },
		portal: { f: 180, d: 0.3, type: 'sine', gain: 0.05, sweep: 2.2 }
	};
	const { f: freq, d: dur, type, gain: level, sweep } = spec[kind];
	osc.type = type;
	osc.frequency.setValueAtTime(freq, now);
	if (sweep) osc.frequency.exponentialRampToValueAtTime(freq * sweep, now + dur);
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(level, now + 0.006);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
	osc.connect(gain).connect(ac.destination);
	osc.start(now);
	osc.stop(now + dur + 0.02);
}
