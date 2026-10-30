/** Handle to the one live GL layer, so any component can poke it without prop drilling. */
import type { LayerHandle } from './layer';

let handle: LayerHandle | null = null;

export function setLayer(h: LayerHandle | null): void {
	handle = h;
}

export function getLayer(): LayerHandle | null {
	return handle;
}

export function burstAt(x: number, y: number): void {
	handle?.burst(x, y);
}
