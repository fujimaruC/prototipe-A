/**
 * Gamification state. One store, one storage key, everything guarded: the site must work with
 * storage blocked, so a failed read just means a fresh run.
 */

const KEY = 'nex.game';

export interface GameState {
	xp: number;
	level: number;
	packets: number;
	combo: number;
	bestCombo: number;
	achievements: string[];
	seen: string[];
}

export interface Achievement {
	id: string;
	label: string;
	detail: string;
	xp: number;
}

/** The badge wall. Each unlocks from something the visitor actually did. */
export const ACHIEVEMENTS: Achievement[] = [
	{ id: 'first-packet', label: 'First packet', detail: 'Captured a packet in the hero field.', xp: 20 },
	{ id: 'ten-packets', label: 'Flow state', detail: 'Captured ten packets.', xp: 60 },
	{ id: 'combo-5', label: 'Burst', detail: 'Five packets inside one combo window.', xp: 80 },
	{ id: 'traced-1', label: 'Traced one', detail: 'Submitted a valid test point.', xp: 50 },
	{ id: 'traced-all', label: 'Full trace', detail: 'All six test points.', xp: 200 },
	{ id: 'invert', label: 'Negative', detail: 'Switched to negative mode.', xp: 15 },
	{ id: 'index', label: 'Index reader', detail: 'Opened the sheet index.', xp: 15 },
	{ id: 'fujimaru', label: 'Summoned', detail: 'Called Fujimaru from the index.', xp: 25 },
	{ id: 'konami', label: 'Up up down down', detail: 'Found the Konami code.', xp: 100 },
	{ id: 'all-sections', label: 'Full sweep', detail: 'Visited every section.', xp: 70 }
];

export const LEVEL_STEP = 100;

function fresh(): GameState {
	return { xp: 0, level: 1, packets: 0, combo: 0, bestCombo: 0, achievements: [], seen: [] };
}

function load(): GameState {
	try {
		const raw = sessionStorage.getItem(KEY);
		if (!raw) return fresh();
		const parsed = JSON.parse(raw) as Partial<GameState>;
		const xp = typeof parsed.xp === 'number' && !isNaN(parsed.xp) ? Math.max(0, parsed.xp) : 0;
		const level = Math.floor(xp / LEVEL_STEP) + 1;
		const packets = typeof parsed.packets === 'number' ? Math.max(0, parsed.packets) : 0;
		const bestCombo = typeof parsed.bestCombo === 'number' ? Math.max(0, parsed.bestCombo) : 0;
		const achievements = Array.isArray(parsed.achievements) ? parsed.achievements.filter((x): x is string => typeof x === 'string') : [];
		const seen = Array.isArray(parsed.seen) ? parsed.seen.filter((x): x is string => typeof x === 'string') : [];
		return { xp, level, packets, combo: 0, bestCombo, achievements, seen };
	} catch {
		return fresh();
	}
}

function save(s: GameState): void {
	try {
		sessionStorage.setItem(KEY, JSON.stringify(s));
	} catch {
		/* private mode or quota: the run simply does not persist */
	}
}

export const game = $state<GameState>(fresh());

let hydrated = false;
export function hydrateGame(): void {
	if (hydrated) return;
	hydrated = true;
	Object.assign(game, load());
}

export interface Unlock {
	achievement: Achievement;
	levelUp: boolean;
}

/** Awards an achievement once. Returns null if it was already held. */
export function unlock(id: string): Unlock | null {
	const a = ACHIEVEMENTS.find((x) => x.id === id);
	if (!a || game.achievements.includes(id)) return null;
	game.achievements = [...game.achievements, id];
	const before = game.level;
	game.xp += a.xp;
	game.level = Math.floor(game.xp / LEVEL_STEP) + 1;
	save(game);
	return { achievement: a, levelUp: game.level > before };
}

/** XP per collected packet, before any achievement bonus. */
const PACKET_XP = 5;

export function addPackets(n = 1): { unlocks: Unlock[]; levelUp: boolean } {
	const prevLevel = game.level;
	game.packets += n;
	game.xp += PACKET_XP * n;
	game.level = Math.floor(game.xp / LEVEL_STEP) + 1;
	const packetLevelUp = game.level > prevLevel;
	game.combo += n;
	game.bestCombo = Math.max(game.bestCombo, game.combo);
	const out: Unlock[] = [];
	const push = (u: Unlock | null) => {
		if (u) out.push(u);
	};
	if (game.packets >= 1) push(unlock('first-packet'));
	if (game.packets >= 10) push(unlock('ten-packets'));
	if (game.combo >= 5) push(unlock('combo-5'));
	save(game);
	return { unlocks: out, levelUp: packetLevelUp };
}

export function resetCombo(): void {
	game.combo = 0;
	save(game);
}

export function markSectionSeen(id: string): Unlock | null {
	if (game.seen.includes(id)) return null;
	game.seen = [...game.seen, id];
	save(game);
	// Six sections exist (home, profile, cases, record, stack, contact); the badge says
	// "Visited every section", so the threshold must be all six.
	const SECTIONS = 6;
	if (game.seen.length >= SECTIONS) {
		return unlock('all-sections');
	}
	return null;
}

export function progress(): number {
	return (game.xp % LEVEL_STEP) / LEVEL_STEP;
}

export function resetGame(): void {
	Object.assign(game, fresh());
	save(game);
}
