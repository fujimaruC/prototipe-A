/**
 * 4x4 Bayer ordered dithering, shared by the hero resolve and the plate wipe.
 * One implementation, two uses — that is why the load and the transition feel like one system.
 */

const BAYER4 = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
];

export function bayer(x: number, y: number): number {
	return (BAYER4[y & 3]?.[x & 3] ?? 0) / 16;
}

export interface DitherOptions {
	width: number;
	height: number;
	cell: number;
	/** 0 = fully noise, 1 = fully resolved (nothing drawn). */
	progress: number;
	ink: string;
	ground: string;
	/** Deterministic seed so two frames of the same progress look identical. */
	seed?: number;
}

/** Paints ordered-dither noise onto a 2D context. Returns nothing; the caller owns the canvas. */
export function paintDither(ctx: CanvasRenderingContext2D, o: DitherOptions): void {
	const { width, height, cell, progress, ink, ground, seed = 1 } = o;
	ctx.fillStyle = ground;
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = ink;

	const cols = Math.ceil(width / cell);
	const rows = Math.ceil(height / cell);
	let state = (seed * 2654435761) >>> 0;

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			state = (state * 1664525 + 1013904223) >>> 0;
			const noise = (state >>> 8) / 16777216;
			// Threshold sweeps diagonally so the resolve reads as a plotter filling the sheet.
			const wave = (x / cols) * 0.55 + (y / rows) * 0.45;
			const threshold = wave * 0.72 + bayer(x, y) * 0.28;
			const density = 1 - progress;
			if (noise * density > threshold * 0.85) {
				ctx.fillRect(x * cell, y * cell, cell, cell);
			}
		}
	}
}

/** Vertical band wipe: each band resolves at a slightly different moment. */
export function paintWipe(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	cell: number,
	progress: number,
	ink: string,
	ground: string,
): void {
	const bands = 4;
	const bandH = height / bands;
	ctx.fillStyle = ground;
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = ink;
	for (let b = 0; b < bands; b++) {
		const local = Math.min(1, Math.max(0, progress * 1.6 - b * 0.18));
		if (local >= 1) continue;
		const cols = Math.ceil(width / cell);
		const rows = Math.ceil(bandH / cell);
		for (let y = 0; y < rows; y++) {
			for (let x = 0; x < cols; x++) {
				if (bayer(x, y + b) > local) {
					ctx.fillRect(x * cell, b * bandH + y * cell, cell, cell);
				}
			}
		}
	}
}
