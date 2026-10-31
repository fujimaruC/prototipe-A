/** Toast queue. Lives in a module because a Svelte 5 component cannot export functions. */

import { game, type Achievement } from './state.svelte';

export interface Toast {
	id: number;
	kind: 'achievement' | 'level';
	title: string;
	detail: string;
	xp?: number;
}

export const toasts = $state<{ items: Toast[] }>({ items: [] });

let nextId = 1;
const MAX = 3;

function push(t: Omit<Toast, 'id'>): void {
	const item: Toast = { ...t, id: nextId++ };
	toasts.items = [item, ...toasts.items].slice(0, MAX);
	window.setTimeout(() => dismiss(item.id), t.kind === 'level' ? 3600 : 4200);
}

export function dismiss(id: number): void {
	toasts.items = toasts.items.filter((t) => t.id !== id);
}

export function pushAchievement(a: Achievement, levelUp: boolean): void {
	if (levelUp) {
		push({ kind: 'level', title: `Level ${game.level}`, detail: 'The sheet revises itself.' });
	}
	push({ kind: 'achievement', title: a.label, detail: a.detail, xp: a.xp });
}

export function pushToast(title: string, detail: string): void {
	push({ kind: 'level', title, detail });
}
