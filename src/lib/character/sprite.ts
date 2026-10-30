/**
 * Fujimaru, 24x24, drawn in code. Variant A of the three prototyped on /sprite-test:
 * balanced posture, crosshair visor, RJ45 tail. Chosen because it stays readable at 24px,
 * where B's visor band collapsed and C's wire loop turned to noise.
 *
 * Legend: '.' empty, '#' ink, 'o' paper, '*' rust accent.
 */

export const PALETTE = {
	'#': 'var(--ink)',
	o: 'var(--ground)',
	'*': 'var(--accent)'
} as const;

const IDLE = [
	'.......#######..........',
	'.....##########.........',
	'....############........',
	'...##############.......',
	'...###.......####.......',
	'..###.*******.###.......',
	'..##.***#****.###.......',
	'..##.*#####**.###.......',
	'..##.***#****.###.......',
	'..###.*******.###.......',
	'...###.......###........',
	'....###########.........',
	'....###########.........',
	'...#####oo######........',
	'..#####o*o######........',
	'..#####ooo#######.......',
	'..################......',
	'...################.....',
	'....##########..###.....',
	'....###..###.....##.....',
	'....###..###....***.....',
	'...###..###....**#*.....',
	'..###...###.....**......',
	'........................'
];

/** Blink: the visor's crosshair collapses to a single lit row. */
const BLINK = IDLE.map((row, y) =>
	y >= 6 && y <= 8 ? row.replace(/\*/g, '.').replace(/^(\s*\.*)\./, '$1.') : row
).map((row, y) => (y === 7 ? row.replace('#####', '*****') : row));

/** Walk: legs swap, tail swings one cell. */
const WALK = IDLE.map((row, y) => {
	if (y === 19) return '....###..###....##......';
	if (y === 20) return '....###..###....***.....';
	if (y === 21) return '...###..###....**#*.....';
	if (y === 22) return '..###...###.....**......';
	return row;
});

export type SpriteFrame = 'idle' | 'blink' | 'walk';

export const FRAMES: Record<SpriteFrame, string[]> = { idle: IDLE, blink: BLINK, walk: WALK };
