import assert from "node:assert/strict";
import test from "node:test";
import {
  PALETTE,
  SPHERE_COUNT,
  cloudRadius,
  colorForWindow,
  damp,
  fillSphere,
  fillStream,
  hash01,
  sharedSeconds,
} from "../src/field.js";

test("shared clock is seconds since local midnight", () => {
  const now = new Date(2026, 0, 2, 0, 1, 0, 0).getTime();
  assert.equal(sharedSeconds(now), 60);
});

test("damping matches the published 0.05 falloff at 60fps", () => {
  assert.ok(Math.abs(damp(0, 10, 1 / 60) - 0.5) < 1e-9);
});

test("window order walks the demo palette", () => {
  assert.deepEqual(colorForWindow(0), PALETTE[0]);
  assert.deepEqual(colorForWindow(1), PALETTE[1]);
  assert.deepEqual(colorForWindow(PALETTE.length), PALETTE[0]);
});

test("sphere samples are deterministic and split into nucleus and atmosphere", () => {
  const count = 20;
  const radius = 100;
  const aPos = new Float32Array(count * 3);
  const bPos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  fillSphere(count, radius, 4, PALETTE[1], [PALETTE[0], PALETTE[1]], aPos, colors, sizes);
  fillSphere(count, radius, 4, PALETTE[1], [PALETTE[0], PALETTE[1]], bPos, colors, sizes);
  assert.deepEqual(aPos, bPos);

  const nucleus = Math.hypot(aPos[0], aPos[1], aPos[2]);
  const shell = Math.hypot(aPos[30], aPos[31], aPos[32]);
  assert.ok(nucleus < radius * 0.5);
  assert.ok(shell > radius * 0.5);
  assert.ok(shell < radius * 1.25);
  assert.equal(SPHERE_COUNT, 5000);
});

test("stream samples stay on the segment between two orbs", () => {
  const count = 32;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  fillStream(count, 0, 0, 400, 0, 40, 2, PALETTE[0], PALETTE[1], positions, colors, sizes);
  for (let i = 0; i < count; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    assert.ok(x > 20 && x < 420);
    assert.ok(Math.abs(y) < 80);
    assert.ok(Number.isFinite(colors[i * 3]));
  }
});

test("hash01 stays inside the unit interval", () => {
  for (let i = 0; i < 50; i++) {
    const value = hash01(i);
    assert.ok(value >= 0 && value < 1);
  }
});

test("cloud radius tracks the short side of the window", () => {
  assert.equal(cloudRadius({ w: 800, h: 600 }), 132);
});
