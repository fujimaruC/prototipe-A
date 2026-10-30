/**
 * Test points are stored as SHA-256 digests only. The plaintext token never exists in the
 * bundle, in any encoding — it lives in robots.txt, the drawing, or the page source, in a
 * form you have to notice. The only thing a correct answer buys is the recorded ID.
 */

export interface TestPoint {
	id: string;
	hash: string;
}

export const TEST_POINTS: TestPoint[] = [
	{
		id: 'TP-01',
		hash: '6c3788a85e287ab247d684bb7c0955dc1f4d251dc17e2a3f8a6ce7bd157371fe'
	},
	{
		id: 'TP-02',
		hash: 'f3f14cd88a1c31228bd90369fe728722cd6ea129898cb6d9413b4b940b74e51e'
	},
	{
		id: 'TP-03',
		hash: '9aa59e8b3f7dd6dcca829d962c2136fc15729055be3dbaf2ae252c1dea9c3bad'
	},
	{
		id: 'TP-04',
		hash: '27d327c103274048c226363539613c3448afeb1a33657e5a168d4bd5f85338da'
	},
	{
		id: 'TP-05',
		hash: '1c595eb1a01d5342585adb0b4a1b53f7655e4cf96df035d215f2a86c2a6e5cb3'
	},
	{
		id: 'TP-06',
		hash: '65d8bdb25c4f48310daef2adbc823f458455d780356f552d25434f341f23d7b0'
	}
];

export const TOTAL_TEST_POINTS = TEST_POINTS.length;

export type SubmitResult =
	| { kind: 'found'; id: string }
	| { kind: 'duplicate'; id: string }
	| { kind: 'invalid' }
	| { kind: 'unavailable' };

async function digest(value: string): Promise<string | null> {
	const subtle = globalThis.crypto?.subtle;
	if (!subtle) return null;
	const bytes = new TextEncoder().encode(value);
	const buf = await subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export function normalize(input: string): string {
	return input.trim().replace(/\s+/g, ' ');
}

export async function submit(input: string, alreadyFound: string[]): Promise<SubmitResult> {
	const value = normalize(input);
	if (!value) return { kind: 'invalid' };
	const hash = await digest(value);
	if (!hash) return { kind: 'unavailable' };
	const match = TEST_POINTS.find((tp) => tp.hash === hash);
	if (!match) return { kind: 'invalid' };
	if (alreadyFound.includes(match.id)) return { kind: 'duplicate', id: match.id };
	return { kind: 'found', id: match.id };
}
