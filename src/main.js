import * as THREE from "three";
import { WindowManager } from "./windowManager.js";
import { cloudRadius, colorForWindow, damp, sharedSeconds } from "./field.js";
import {
  createOrb,
  createStreams,
  disposeOrb,
  setPixelRatio,
  syncStreamGeometry,
  updateOrb,
  updateStreams,
} from "./clouds.js";

const params = new URLSearchParams(window.location.search);
if (params.get("clear")) localStorage.clear();

const windowIdLabel = document.getElementById("windowId");
const connectedLabel = document.getElementById("connectedCount");
const entanglementLabel = document.getElementById("entanglementStatus");

document.getElementById("open").addEventListener("click", () => {
  const left = window.screenX + Math.round(window.innerWidth * 0.42);
  const top = window.screenY + 48;
  window.open(location.pathname, "_blank", `width=720,height=640,left=${left},top=${top}`);
});

let started = false;
document.addEventListener("visibilitychange", boot);
window.addEventListener("load", boot);

function boot() {
  if (started || document.visibilityState === "hidden") return;
  started = true;
  setTimeout(start, 500);
}

function start() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -4000, 4000);
  camera.position.z = 1000;

  const world = new THREE.Group();
  scene.add(world);

  const manager = new WindowManager();
  const orbs = new Map();
  const streams = createStreams(pixelRatio);
  manager.init({ kind: "orb" });
  windowIdLabel.textContent = String(manager.getThisWindowID());

  let offsetX = -window.screenX;
  let offsetY = -window.screenY;
  let last = performance.now();

  window.addEventListener("resize", () => resize(camera, renderer, orbs, streams));

  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    manager.update();

    const wins = manager.getWindows();
    syncOrbs(wins, orbs, world, renderer.getPixelRatio());
    const colors = wins.map((_, index) => colorForWindow(index));

    offsetX = damp(offsetX, -window.screenX, dt);
    offsetY = damp(offsetY, -window.screenY, dt);
    world.position.set(offsetX, offsetY, 0);

    const t = sharedSeconds();
    const centers = [];
    wins.forEach((win, index) => {
      const orb = orbs.get(win.id);
      const targetX = win.shape.x + win.shape.w * 0.5;
      const targetY = win.shape.y + win.shape.h * 0.5;
      orb.current.x = damp(orb.current.x, targetX, dt);
      orb.current.y = damp(orb.current.y, targetY, dt);
      orb.group.position.set(orb.current.x, orb.current.y, 0);
      const radius = damp(orb.radius, cloudRadius(win.shape), dt);
      orb.radius = radius;
      updateOrb(orb, radius, t, colors[index], colors);
      centers.push({ x: orb.current.x, y: orb.current.y, radius, color: colors[index] });
    });

    const pairs = [];
    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        const a = centers[i];
        const b = centers[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < (a.radius + b.radius) * 0.35) continue;
        pairs.push({
          ax: a.x,
          ay: a.y,
          bx: b.x,
          by: b.y,
          radius: (a.radius + b.radius) * 0.5,
          colorA: a.color,
          colorB: b.color,
        });
      }
    }
    syncStreamGeometry(streams, pairs.length);
    if (streams.points && streams.points.parent !== world) world.add(streams.points);
    if (pairs.length > 0) updateStreams(streams, pairs, t);

    const others = Math.max(0, wins.length - 1);
    connectedLabel.textContent = String(others);
    entanglementLabel.textContent = others > 0 ? "Active" : "None";
    renderer.render(scene, camera);
  });

  resize(camera, renderer, orbs, streams);
}

function syncOrbs(wins, orbs, world, pixelRatio) {
  const live = new Set(wins.map((win) => win.id));
  for (const [id, orb] of orbs) {
    if (live.has(id)) continue;
    disposeOrb(orb);
    orbs.delete(id);
  }
  for (const win of wins) {
    if (orbs.has(win.id)) continue;
    const orb = createOrb(pixelRatio);
    orb.current = {
      x: win.shape.x + win.shape.w * 0.5,
      y: win.shape.y + win.shape.h * 0.5,
    };
    orb.radius = cloudRadius(win.shape);
    world.add(orb.group);
    orbs.set(win.id, orb);
  }
}

function resize(camera, renderer, orbs, streams) {
  camera.left = 0;
  camera.right = window.innerWidth;
  camera.top = 0;
  camera.bottom = window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  const pixelRatio = renderer.getPixelRatio();
  for (const orb of orbs.values()) setPixelRatio(orb.points.material, pixelRatio);
  if (streams.points) setPixelRatio(streams.points.material, pixelRatio);
  streams.pixelRatio = pixelRatio;
}
