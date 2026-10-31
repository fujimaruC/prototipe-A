/**
 * The hero packet field: nodes drifting on a canvas, packets travelling between them.
 * Tapping a packet collects it. Pointer and touch share the same code path, so the mobile
 * version is the same feature, not a reduced one.
 *
 * Lives on its own canvas inside the hero, behind the copy, and stops when off screen.
 */

export interface FieldOptions {
	canvas: HTMLCanvasElement;
	onCollect: (x: number, y: number) => void;
	/** Node count scales with area; phones get fewer, not none. */
	maxNodes?: number;
}

export interface FieldHandle {
	destroy: () => void;
	/** Screen-space hit test; returns true when a packet was collected. */
	tryCollect: (clientX: number, clientY: number) => boolean;
}

interface Packet {
	from: number;
	to: number;
	t: number;
	speed: number;
}

export function createField({ canvas, onCollect, maxNodes = 14 }: FieldOptions): FieldHandle {
	const ctx = canvas.getContext('2d');
	if (!ctx) return { destroy() {}, tryCollect: () => false };

	let w = 0;
	let h = 0;
	let dpr = 1;
	let nodes: { x: number; y: number; r: number; pulse: number }[] = [];
	let packets: Packet[] = [];
	let raf = 0;
	let running = true;
	let last = 0;
	const dprCap = Math.min(window.devicePixelRatio || 1, 2);

	const resize = () => {
		const rect = canvas.getBoundingClientRect();
		w = rect.width;
		h = rect.height;
		dpr = dprCap;
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const count = Math.max(6, Math.min(maxNodes, Math.round((w * h) / 42000)));
		nodes = Array.from({ length: count }, () => ({
			x: 0.06 * w + Math.random() * w * 0.88,
			y: 0.1 * h + Math.random() * h * 0.8,
			r: 1.6 + Math.random() * 1.4,
			pulse: Math.random() * Math.PI * 2
		}));
		packets = [];
	};

	const spawn = () => {
		if (nodes.length < 2) return;
		const from = Math.floor(Math.random() * nodes.length);
		let to = Math.floor(Math.random() * nodes.length);
		if (to === from) to = (to + 1) % nodes.length;
		packets.push({ from, to, t: 0, speed: 0.22 + Math.random() * 0.3 });
	};

	const colors = () => {
		const cs = getComputedStyle(document.documentElement);
		return {
			ink: cs.getPropertyValue('--ink').trim() || '#0a0a0a',
			accent: cs.getPropertyValue('--accent').trim() || '#a34817'
		};
	};

	let palette = colors();

	const draw = (now: number) => {
		if (!running) return;
		const dt = Math.min(48, now - last || 16);
		last = now;

		ctx.clearRect(0, 0, w, h);

		// links
		ctx.strokeStyle = palette.ink;
		ctx.globalAlpha = 0.26;
		ctx.lineWidth = 1;
		for (let i = 0; i < nodes.length; i++) {
			const a = nodes[i];
			const b = nodes[(i + 1) % nodes.length];
			if (!a || !b) continue;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y);
			ctx.lineTo(b.x, b.y);
			ctx.stroke();
		}

		// nodes
		ctx.globalAlpha = 0.72;
		for (const n of nodes) {
			n.pulse += dt * 0.002;
			ctx.fillStyle = palette.ink;
			ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
		}

		// packets
		ctx.globalAlpha = 1;
		ctx.fillStyle = palette.accent;
		for (let i = packets.length - 1; i >= 0; i--) {
			const p = packets[i];
			if (!p) continue;
			p.t += (dt / 1000) * p.speed;
			if (p.t >= 1) {
				packets.splice(i, 1);
				continue;
			}
			const a = nodes[p.from];
			const b = nodes[p.to];
			if (!a || !b) continue;
			const x = a.x + (b.x - a.x) * p.t;
			const y = a.y + (b.y - a.y) * p.t;
			ctx.fillRect(x - 3, y - 3, 6, 6);
		}

		raf = requestAnimationFrame(draw);
	};

	const io = new IntersectionObserver((entries) => {
		const visible = entries.some((e) => e.isIntersecting);
		if (visible && !running) {
			running = true;
			last = 0;
			raf = requestAnimationFrame(draw);
		} else if (!visible && running) {
			running = false;
			cancelAnimationFrame(raf);
		}
	});

	resize();
	io.observe(canvas);
	window.addEventListener('resize', resize);
	raf = requestAnimationFrame(draw);

	const spawnTimer = window.setInterval(() => {
		if (running && packets.length < 18) spawn();
	}, 220);

	// theme changes swap the palette without rebuilding the field
	const mo = new MutationObserver(() => {
		palette = colors();
	});
	mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });

	return {
		destroy() {
			running = false;
			cancelAnimationFrame(raf);
			window.clearInterval(spawnTimer);
			window.removeEventListener('resize', resize);
			io.disconnect();
			mo.disconnect();
		},
		tryCollect(clientX, clientY) {
			const rect = canvas.getBoundingClientRect();
			const x = clientX - rect.left;
			const y = clientY - rect.top;
			// generous radius: a finger is not a mouse
			const hit = 46;
			let bestIdx = -1;
			let bestDist = Infinity;
			for (let i = 0; i < packets.length; i++) {
				const p = packets[i];
				if (!p) continue;
				const a = nodes[p.from];
				const b = nodes[p.to];
				if (!a || !b) continue;
				const px = a.x + (b.x - a.x) * p.t;
				const py = a.y + (b.y - a.y) * p.t;
				const d = Math.hypot(px - x, py - y);
				if (d < hit && d < bestDist) {
					bestDist = d;
					bestIdx = i;
				}
			}
			if (bestIdx < 0) return false;
			const a = nodes[packets[bestIdx]?.from ?? 0];
			const b = nodes[packets[bestIdx]?.to ?? 0];
			const p = packets[bestIdx];
			if (!a || !b || !p) return false;
			onCollect(a.x + (b.x - a.x) * p.t + rect.left, a.y + (b.y - a.y) * p.t + rect.top);
			packets.splice(bestIdx, 1);
			return true;
		}
	};
}
