/** GLSL for the one shared layer. Two passes: heat (background) then network (hero band). */

export const VERT = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = vec4(position, 0.0, 1.0);
}
`;

/** 4x4 Bayer threshold, the same matrix the 2D dither uses. */
/**
 * 4x4 ordered dither threshold, GLSL ES 1.00 safe (no array constructors, no dynamic indexing).
 * Bit-interleaves the four bits of the cell coordinate, which visits all 16 levels exactly once
 * — the same distribution as the 2D Bayer matrix used in fx/dither.ts.
 */
const BAYER = /* glsl */ `
float bayer(vec2 p) {
	vec2 f = floor(mod(p, 4.0));
	float a = mod(f.x, 2.0);
	float b = mod(f.y, 2.0);
	float c = mod(floor(f.x * 0.5), 2.0);
	float d = mod(floor(f.y * 0.5), 2.0);
	return (a * 8.0 + b * 4.0 + c * 2.0 + d) / 16.0;
}
`;

export const HEAT_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform float uScrollVel;
uniform float uBurst;
uniform vec3 uInk;
uniform vec3 uGround;
uniform float uNegative;
uniform float uPixel;
uniform vec4 uRect;      // hero band in uv space; outside it the layer is pure ground

${BAYER}

float smin(float a, float b, float k) {
	float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
	return mix(b, a, h) - k * h * (1.0 - h);
}

void main() {
	float aspect = uRes.x / max(uRes.y, 1.0);
	vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);

	/*
	 * Intensity, not a signed distance. An SDF is flat inside a blob, so dithering it prints a
	 * regular lattice: the threshold sees one constant value across the whole core. A smooth
	 * falloff per blob keeps the threshold varying continuously, which is what makes ordered
	 * dithering read as a soft mass instead of a grid.
	 */
	float heat = 0.0;
	for (int i = 0; i < 6; i++) {
		float fi = float(i);
		float a = uTime * (0.11 + fi * 0.017) + fi * 2.399;
		vec2 c = vec2(
			cos(a) * (0.30 + 0.12 * sin(fi * 1.7 + uTime * 0.21)),
			sin(a * 1.13) * (0.20 + 0.09 * cos(fi * 2.1))
		);
		c.y *= 1.0 + clamp(abs(uScrollVel) * 0.010, 0.0, 0.4);
		float r = 0.16 + 0.05 * sin(uTime * 0.7 + fi);
		vec2 d = (p - c) / r;
		heat += exp(-dot(d, d) * 1.7);
	}

	// cursor attraction adds a blob, the burst adds a hot flash
	vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
	vec2 dm = (p - m) / 0.14;
	heat += uMouseStrength * 0.9 * exp(-dot(dm, dm) * 1.6);
	heat += uBurst * 1.4 * exp(-dot(p, p) * 5.0);

	// soft ceiling: the field stays a paper texture, never a veil over the type
	float intensity = min(heat * 0.34, 0.55);

	// Confine to the hero band, and start below the role line so small type stays on paper.
	vec2 hp = (vUv - uRect.xy) / max(uRect.zw, vec2(0.0001));
	float band =
		step(0.0, hp.x) * step(hp.x, 1.0) *
		step(0.0, hp.y) * step(hp.y, 1.0) *
		smoothstep(0.0, 0.22, hp.y);
	intensity *= band;

	vec2 gp = floor(vUv * uRes / uPixel);
	float t = bayer(gp);
	float bit = step(t, intensity);

	vec3 col = mix(uGround, uInk, bit);
	if (uNegative > 0.5) {
		col = mix(uGround, mix(uInk, vec3(0.878, 0.541, 0.361), 0.8), bit);
	}
	gl_FragColor = vec4(col, 1.0);
}
`;

export const NETWORK_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec4 uRect;      // x,y,w,h in uv space of the hero band
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uNegative;
uniform float uPixel;

${BAYER}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 nodePos(float i) {
	float a = hash(vec2(i, 3.1)) * 6.2831;
	float r = 0.16 + hash(vec2(i, 7.7)) * 0.34;
	return vec2(0.5 + cos(a) * r * 1.5, 0.5 + sin(a) * r);
}

void main() {
	// hero band mask with a soft edge
	vec2 hp = (vUv - uRect.xy) / uRect.zw;
	float inside = step(0.0, hp.x) * step(hp.x, 1.0) * step(0.0, hp.y) * step(hp.y, 1.0);
	float edge = smoothstep(0.0, 0.02, hp.x) * smoothstep(1.0, 0.98, hp.x) * smoothstep(0.0, 0.03, hp.y);
	float mask = inside * edge;
	if (mask < 0.01) discard;

	float aspect = uRes.x / max(uRes.y, 1.0);
	vec2 p = (hp - 0.5) * vec2(aspect, 1.0);
	float ink = 0.0;

	// links
	for (int i = 0; i < 7; i++) {
		vec2 a = nodePos(float(i));
		vec2 b = nodePos(float(i + 1));
		vec2 pa = (a - 0.5) * vec2(aspect, 1.0);
		vec2 pb = (b - 0.5) * vec2(aspect, 1.0);
		vec2 ab = pb - pa;
		float h = clamp(dot(p - pa, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
		float d = length(p - pa - ab * h);
		ink = max(ink, 1.0 - smoothstep(0.0, 0.0022, d));
	}

	// nodes
	for (int i = 0; i < 8; i++) {
		vec2 a = (nodePos(float(i)) - 0.5) * vec2(aspect, 1.0);
		float d = length(p - a);
		ink = max(ink, 1.0 - smoothstep(0.0075, 0.0095, d));
	}

	// packets travelling the links
	for (int i = 0; i < 7; i++) {
		vec2 a = (nodePos(float(i)) - 0.5) * vec2(aspect, 1.0);
		vec2 b = (nodePos(float(i + 1)) - 0.5) * vec2(aspect, 1.0);
		float t = fract(uTime * 0.16 + float(i) * 0.13);
		vec2 c = mix(a, b, t);
		float d = length(p - c);
		ink = max(ink, 1.0 - smoothstep(0.0035, 0.0055, d));
	}

	// cursor ripple
	vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
	float dm = length(p - m);
	ink += 0.35 * (1.0 - smoothstep(0.0, 0.16, dm)) * (1.0 - smoothstep(0.0, 0.02, abs(dm - 0.11)));

	vec2 gp = floor(vUv * uRes / uPixel);
	float t2 = bayer(gp);
	float bit = step(0.55, ink + (t2 - 0.5) * 0.6) * mask;

	vec3 base = uInk;
	if (uNegative > 0.5) base = uAccent;
	gl_FragColor = vec4(base, bit * 0.5);
}
`;
