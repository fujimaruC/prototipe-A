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

export function tick(kind: 'tap' | 'open' | 'found' = 'tap'): void {
	const ac = context();
	if (!ac) return;
	if (ac.state === 'suspended') void ac.resume();
	const now = ac.currentTime;
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	const freq = kind === 'found' ? 880 : kind === 'open' ? 320 : 220;
	const dur = kind === 'found' ? 0.18 : 0.045;
	osc.type = 'square';
	osc.frequency.setValueAtTime(freq, now);
	if (kind === 'found') osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + dur);
	gain.gain.setValueAtTime(0.0001, now);
	gain.gain.exponentialRampToValueAtTime(0.06, now + 0.006);
	gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
	osc.connect(gain).connect(ac.destination);
	osc.start(now);
	osc.stop(now + dur + 0.02);
}
