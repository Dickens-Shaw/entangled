import * as THREE from "three";
import { SPHERE_COUNT, STREAM_COUNT, fillSphere, fillStream } from "./field.js";

const pointVertex = `
  attribute float aSize;
  attribute vec3 color;
  uniform float uPixelRatio;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio;
  }
`;

const pointFragment = `
  varying vec3 vColor;
  void main() {
    vec2 p = gl_PointCoord - vec2(0.5);
    float d = length(p) * 2.0;
    float circle = exp(-d * d * 2.2);
    if (circle < 0.02) discard;
    gl_FragColor = vec4(vColor, circle);
  }
`;

export function createOrb(pixelRatio) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", dynamicAttr(SPHERE_COUNT * 3, 3));
  geometry.setAttribute("color", dynamicAttr(SPHERE_COUNT * 3, 3));
  geometry.setAttribute("aSize", dynamicAttr(SPHERE_COUNT, 1));
  const points = new THREE.Points(geometry, pointMaterial(pixelRatio));
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(points);
  return { group, points };
}

export function updateOrb(orb, radius, t, ownColor, allColors) {
  const geometry = orb.points.geometry;
  fillSphere(
    SPHERE_COUNT,
    radius,
    t,
    ownColor,
    allColors,
    geometry.attributes.position.array,
    geometry.attributes.color.array,
    geometry.attributes.aSize.array,
  );
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.aSize.needsUpdate = true;
  orb.points.rotation.y = t * 0.48;
  orb.points.rotation.x = Math.sin(t * 0.3) * 0.15;
}

export function disposeOrb(orb) {
  orb.group.removeFromParent();
  orb.points.geometry.dispose();
  orb.points.material.dispose();
}

export function createStreams(pixelRatio) {
  return {
    points: null,
    pairCount: 0,
    pixelRatio,
  };
}

export function syncStreamGeometry(streams, pairCount) {
  if (streams.pairCount === pairCount) return;
  if (streams.points) {
    streams.points.removeFromParent();
    streams.points.geometry.dispose();
    streams.points.material.dispose();
    streams.points = null;
  }
  streams.pairCount = pairCount;
  if (pairCount === 0) return;
  const count = pairCount * STREAM_COUNT;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", dynamicAttr(count * 3, 3));
  geometry.setAttribute("color", dynamicAttr(count * 3, 3));
  geometry.setAttribute("aSize", dynamicAttr(count, 1));
  const points = new THREE.Points(geometry, pointMaterial(streams.pixelRatio));
  points.frustumCulled = false;
  points.renderOrder = 2;
  streams.points = points;
}

export function updateStreams(streams, pairs, t) {
  const positions = streams.points.geometry.attributes.position.array;
  const colors = streams.points.geometry.attributes.color.array;
  const sizes = streams.points.geometry.attributes.aSize.array;
  pairs.forEach((pair, index) => {
    const start = index * STREAM_COUNT;
    fillStream(
      STREAM_COUNT,
      pair.ax,
      pair.ay,
      pair.bx,
      pair.by,
      pair.radius,
      t,
      pair.colorA,
      pair.colorB,
      positions.subarray(start * 3, (start + STREAM_COUNT) * 3),
      colors.subarray(start * 3, (start + STREAM_COUNT) * 3),
      sizes.subarray(start, start + STREAM_COUNT),
      index * 10007,
    );
  });
  streams.points.geometry.attributes.position.needsUpdate = true;
  streams.points.geometry.attributes.color.needsUpdate = true;
  streams.points.geometry.attributes.aSize.needsUpdate = true;
}

export function setPixelRatio(material, pixelRatio) {
  material.uniforms.uPixelRatio.value = pixelRatio;
}

function dynamicAttr(length, itemSize) {
  return new THREE.BufferAttribute(new Float32Array(length), itemSize).setUsage(THREE.DynamicDrawUsage);
}

function pointMaterial(pixelRatio) {
  return new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: pixelRatio } },
    vertexShader: pointVertex,
    fragmentShader: pointFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}
