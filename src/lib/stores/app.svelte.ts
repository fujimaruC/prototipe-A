/** Shared client state. Storage access is always guarded — the site must work without it. */

import { detectTier, stepDown, type Tier } from '$lib/fx/quality';

const KEY_MODE = 'nex.mode';
const KEY_FOUND = 'nex.found';
const KEY_SEEN = 'nex.seen';

function read(key: string): string | null {
	try {
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

function write(key: string, value: string): void {
	try {
		sessionStorage.setItem(key, value);
	} catch {
		/* private mode, quota, disabled storage — ignore */
	}
}

function parseFound(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
	} catch {
		return [];
	}
}

export const app = $state({
	mode: 'light' as 'light' | 'negative',
	found: [] as string[],
	introSeen: false,
	sound: false,
	indexOpen: false,
	ready: false,
	tier: 'low' as Tier,
	scrollVelocity: 0,
	packets: 0,
	section: 'home',
	characterAt: { x: -100, y: -100 },
	konami: false
});

export function hydrate(): void {
	if (app.ready) return;
	const mode = read(KEY_MODE);
	if (mode === 'negative' || mode === 'light') app.mode = mode;
	app.found = parseFound(read(KEY_FOUND));
	app.introSeen = read(KEY_SEEN) === '1';
	app.tier = detectTier();
	app.ready = true;
}

export function downgradeTier(): void {
	app.tier = stepDown(app.tier);
}

export function setMode(mode: 'light' | 'negative'): void {
	app.mode = mode;
	write(KEY_MODE, mode);
}

export function toggleMode(): void {
	setMode(app.mode === 'light' ? 'negative' : 'light');
}

export function markSeen(): void {
	app.introSeen = true;
	write(KEY_SEEN, '1');
}

export function addFound(id: string): void {
	if (app.found.includes(id)) return;
	app.found = [...app.found, id];
	write(KEY_FOUND, JSON.stringify(app.found));
}

export function addPacket(): void {
	app.packets += 1;
}

export function allFound(): boolean {
	return app.found.length >= 6;
}
