/**
 * The one WebGL layer. A single fixed canvas hosts the heat (metaball) pass and the hero
 * network pass; both draw into the same framebuffer in that order. Nothing else may create a
 * full-screen canvas.
 */

import { Mesh, Program, Renderer, Transform, Triangle } from 'ogl';
import { HEAT_FRAG, NETWORK_FRAG, VERT } from './shaders';
import { onFrame, type DriverState } from '$lib/fx/driver';
import { heatScale, type Tier } from '$lib/fx/quality';

export interface LayerOptions {
	tier: Tier;
	canvas: HTMLCanvasElement;
	onFps?: (fps: number) => void;
}

export interface LayerHandle {
	destroy: () => void;
	burst: (x: number, y: number) => void;
	setHeroRect: (r: { x: number; y: number; w: number; h: number }) => void;
	setTheme: (negative: boolean) => void;
}

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	const n = Number.parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readTokens(): { ink: string; ground: string; accent: string } {
	const cs = getComputedStyle(document.documentElement);
	return {
		ink: cs.getPropertyValue('--ink').trim() || '#0a0a0a',
		ground: cs.getPropertyValue('--ground').trim() || '#ececec',
		accent: cs.getPropertyValue('--accent').trim() || '#a34817'
	};
}

export function createLayer({ tier, canvas, onFps }: LayerOptions): LayerHandle {
	const renderer = new Renderer({
		canvas,
		// transparent: with the heat pass off, only the network pass draws. An opaque clear
		// would paint a black slab over the hero.
		alpha: true,
		antialias: false,
		dpr: Math.min(window.devicePixelRatio || 1, tier === 'high' ? 2 : 1.5),
		powerPreference: 'high-performance'
	});
	const gl = renderer.gl;
	gl.clearColor(0, 0, 0, 0);

	const scale = heatScale(tier);
	const pixel = tier === 'high' ? 3 : 4;
	const tokens = readTokens();
	const negative = document.documentElement.dataset.mode === 'negative';

	const heat = new Program(gl, {
		vertex: VERT,
		fragment: HEAT_FRAG,
		depthTest: false,
		depthWrite: false,
		uniforms: {
			uTime: { value: 0 },
			uRes: { value: [1, 1] },
			uMouse: { value: [0.5, 0.5] },
			uMouseStrength: { value: 0 },
			uScrollVel: { value: 0 },
			uBurst: { value: 0 },
			uInk: { value: hexToRgb(tokens.ink) },
			uGround: { value: hexToRgb(tokens.ground) },
			uNegative: { value: negative ? 1 : 0 },
			uPixel: { value: pixel },
			uRect: { value: [0, 0.4, 1, 0.6] }
		}
	});

	const network = new Program(gl, {
		vertex: VERT,
		fragment: NETWORK_FRAG,
		transparent: true,
		depthTest: false,
		depthWrite: false,
		uniforms: {
			uTime: { value: 0 },
			uRes: { value: [1, 1] },
			uMouse: { value: [0.5, 0.5] },
			uRect: { value: [0, 0.55, 1, 0.45] },
			uInk: { value: hexToRgb(tokens.ink) },
			uAccent: { value: hexToRgb(tokens.accent) },
			uNegative: { value: negative ? 1 : 0 },
			uPixel: { value: pixel }
		}
	});

	/**
	 * Heat (metaball) pass is disabled. Four tuning rounds still produced a uniform ordered-
	 * dither lattice sitting over the name and the role line, which breaks the one rule that
	 * never bends: content legibility. The brief's own priority list drops heat resolution
	 * first. The shader is kept, wired and ready, behind this flag.
	 */
	const USE_HEAT = false;

	const scene = new Transform();
	const heatMesh = new Mesh(gl, { geometry: new Triangle(gl), program: heat });
	const netMesh = new Mesh(gl, { geometry: new Triangle(gl), program: network });
	if (USE_HEAT) heatMesh.setParent(scene);
	netMesh.setParent(scene);

	let heroRect = { x: 0, y: 0.55, w: 1, h: 0.45 };
	let burst = 0;
	let visible = true;
	let frames = 0;
	let fpsClock = 0;
	let mouseStrength = 0;
	let targetStrength = 0;

	/**
	 * The canvas is fixed to the viewport, but its *drawing area* is the hero band. Sizing the
	 * buffer to the band (rather than masking in the shader) is what guarantees the layer can
	 * never appear over another section, however the page scrolls.
	 */
	const applyBand = (band: { x: number; y: number; w: number; h: number }) => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const top = (1 - (band.y + band.h)) * vh;
		const height = Math.max(1, Math.round(band.h * vh));
		const width = Math.round(vw);
		renderer.setSize(Math.round(width * (scale || 1)), Math.round(height * (scale || 1)));
		// after setSize: it writes canvas.style in buffer pixels and would otherwise halve us
		canvas.style.top = `${Math.round(top)}px`;
		canvas.style.height = `${height}px`;
		canvas.style.width = `${width}px`;
		canvas.style.opacity = height <= 2 ? '0' : '1';
		const rw = renderer.gl.drawingBufferWidth;
		const rh = renderer.gl.drawingBufferHeight;
		heat.uniforms.uRes.value = [rw, rh];
		network.uniforms.uRes.value = [rw, rh];
	};

	const resize = () => applyBand(heroRect);

	const io = new IntersectionObserver(
		(entries) => {
			visible = entries.some((e) => e.isIntersecting);
		},
		{ threshold: 0 }
	);
	io.observe(canvas);

	const stop = onFrame((s: DriverState) => {
		if (!visible) return;

		const now = s.time;
		heat.uniforms.uTime.value = now;
		network.uniforms.uTime.value = now;

		// pointer in 0..1, y flipped to GL space
		if (s.active) {
			heat.uniforms.uMouse.value = [s.px / window.innerWidth, 1 - s.py / window.innerHeight];
			network.uniforms.uMouse.value = [s.px / window.innerWidth, 1 - s.py / window.innerHeight];
			targetStrength = 1;
		} else {
			targetStrength = 0;
		}
		mouseStrength += (targetStrength - mouseStrength) * 0.08;
		heat.uniforms.uMouseStrength.value = mouseStrength;
		heat.uniforms.uScrollVel.value = s.velocity;

		burst *= 0.94;
		heat.uniforms.uBurst.value = burst;

		renderer.render({ scene });

		// fps probe
		frames++;
		if (now - fpsClock > 1) {
			const fps = frames / (now - fpsClock);
			onFps?.(fps);
			frames = 0;
			fpsClock = now;
		}
	});

	window.addEventListener('resize', resize);
	resize();

	return {
		destroy() {
			stop();
			window.removeEventListener('resize', resize);
			io.disconnect();
			renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
		},
		burst(x: number, y: number) {
			burst = 1;
			heat.uniforms.uMouse.value = [x / window.innerWidth, 1 - y / window.innerHeight];
		},
		setHeroRect(r) {
			heroRect = r;
			// inside the band-sized buffer, the band is always the whole texture
			network.uniforms.uRect.value = [0, 0, 1, 1];
			heat.uniforms.uRect.value = [0, 0, 1, 1];
			applyBand(r);
		},
		setTheme(next: boolean) {
			const t = readTokens();
			heat.uniforms.uInk.value = hexToRgb(t.ink);
			heat.uniforms.uGround.value = hexToRgb(t.ground);
			network.uniforms.uInk.value = hexToRgb(t.ink);
			network.uniforms.uAccent.value = hexToRgb(t.accent);
			heat.uniforms.uNegative.value = next ? 1 : 0;
			network.uniforms.uNegative.value = next ? 1 : 0;
		}
	};
}
