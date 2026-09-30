// Deterministic stand-in for demos/demo.html.
// Sphere layout follows that file (nucleus + atmosphere). Streams follow its
// tapered beam. Positions are a function of index and shared time so every
// window reconstructs the same points. Screen placement is handled outside,
// the same way multipleWindow3dScene places its cubes.

export const SPHERE_COUNT = 5000;
export const STREAM_COUNT = 2400;

export const PALETTE = [
  [0.2, 0.8, 0.3],
  [0.8, 0.2, 0.3],
  [0.3, 0.4, 0.9],
  [0.9, 0.7, 0.2],
  [0.8, 0.3, 0.8],
  [0.2, 0.9, 0.8],
  [0.9, 0.5, 0.2],
  [0.6, 0.3, 0.9],
];

export function hash01(i) {
  let x = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

export function sharedSeconds(now = Date.now()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return (now - start.getTime()) / 1000;
}

// multipleWindow3dScene uses falloff 0.05 once per frame at 60fps.
export function damp(current, target, dt, response = 0.05) {
  const frames = Math.max(0, dt) * 60;
  const k = 1 - Math.pow(1 - response, frames);
  return current + (target - current) * k;
}

export function cloudRadius(shape) {
  return Math.min(shape.w, shape.h) * 0.22;
}

export function colorForWindow(sortedIndex) {
  return PALETTE[sortedIndex % PALETTE.length];
}

export function fillSphere(count, radius, t, ownColor, allColors, positions, colors, sizes) {
  const nucleusCount = Math.floor(count * 0.5);
  for (let i = 0; i < count; i++) {
    const nucleus = i < nucleusCount;
    const h = hash01(i + 1);
    const radial = nucleus
      ? radius * 0.4 * Math.pow(h, 0.3)
      : radius * 0.6 + radius * 0.5 * Math.pow(h, 0.5);
    const breathe = 1 + 0.025 * Math.sin(t * 0.8 + i * 0.013);
    const r = radial * breathe;
    const phi = hash01(i + 2) * Math.PI * 2;
    const theta = Math.acos(2 * hash01(i + 3) - 1);
    const i3 = i * 3;
    positions[i3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    positions[i3 + 2] = r * Math.cos(theta);

    const source =
      nucleus && allColors.length > 1
        ? allColors[Math.min(allColors.length - 1, Math.floor(hash01(i + 20) * allColors.length))]
        : ownColor;
    const density = nucleus ? 1 : 0.7;
    const normalized = r / (radius * 1.1);
    const intensity = density * (0.5 + normalized * 0.5);
    colors[i3] = source[0] * intensity;
    colors[i3 + 1] = source[1] * intensity;
    colors[i3 + 2] = source[2] * intensity;
    const sizeFactor = density * (0.7 + hash01(i + 7) * 0.3) * (0.9 + normalized * 0.3);
    sizes[i] = 4.2 * sizeFactor;
  }
}

export function fillStream(count, ax, ay, bx, by, radius, t, colorA, colorB, positions, colors, sizes, offset = 0) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const dirx = dx / len;
  const diry = dy / len;
  const basis = streamBasis(dirx, diry);
  const reach = Math.max(0, len - radius * 1.9);

  for (let i = 0; i < count; i++) {
    const seed = offset + i;
    const flow = (hash01(seed + 12) + t * 0.22) % 1;
    const taper = (1 - flow) ** 2.5;
    const width = radius * (0.16 + 0.7 * taper);
    const ring = Math.pow(hash01(seed + 14), 0.8) * width;
    const angle = hash01(seed + 13) * Math.PI * 2;
    const along = radius * 0.95 + flow * reach;
    const wave = Math.sin(t * 2.4 + flow * 6 + seed * 0.02) * radius * 0.02;
    const wave2 = Math.cos(t * 1.6 + flow * 4 + seed * 0.015) * radius * 0.012;
    const i3 = i * 3;
    positions[i3] = ax + dirx * along + basis.px * (Math.cos(angle) * ring + wave) + basis.qx * (Math.sin(angle) * ring + wave2);
    positions[i3 + 1] = ay + diry * along + basis.py * (Math.cos(angle) * ring + wave) + basis.qy * (Math.sin(angle) * ring + wave2);
    positions[i3 + 2] = Math.sin(angle) * ring * 0.15;

    const source = hash01(seed + 30) > flow ? colorA : colorB;
    const center = ring / (width || 1);
    const intensity = Math.pow(1 - flow * 0.55, 0.8) * Math.pow(1 - center, 0.45);
    const fade = Math.sin(flow * Math.PI);
    const gain = intensity * fade * 1.7;
    colors[i3] = Math.min(1, source[0] * gain);
    colors[i3 + 1] = Math.min(1, source[1] * gain);
    colors[i3 + 2] = Math.min(1, source[2] * gain);
    sizes[i] = 4.4 * (0.7 + hash01(seed + 8) * 0.3) * (0.45 + intensity) * (1 - flow * 0.35) * (1 - center * 0.25);
  }
}

function streamBasis(dirx, diry) {
  const len = Math.hypot(-diry, dirx) || 1;
  return { px: -diry / len, py: dirx / len, qx: 0, qy: 0 };
}
