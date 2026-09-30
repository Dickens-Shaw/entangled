// Same idea as bgstaal/multipleWindow3dScene WindowManager:
// same-origin windows publish screen rectangles through localStorage.
// Particle positions are not part of this payload.

const STALE_MS = 4000;
// The recovered artwork stores its registry under the keys "windows" and "count".
// This lab uses separate keys so the two registries do not overwrite each other.
const WINDOWS_KEY = "lab-windows";
const COUNT_KEY = "lab-count";

export class WindowManager {
  #windows = [];
  #id = 0;
  #winData = null;
  #winChangeCallback = null;

  constructor() {
    window.addEventListener("storage", (event) => {
      if (event.key !== WINDOWS_KEY || !event.newValue) return;
      this.#applyList(JSON.parse(event.newValue));
    });
    window.addEventListener("beforeunload", () => {
      const list = readList().filter((win) => win.id !== this.#id);
      localStorage.setItem(WINDOWS_KEY, JSON.stringify(list));
    });
  }

  init(metaData) {
    const now = Date.now();
    const existing = readList().filter((win) => now - (win.seen || 0) < STALE_MS);
    const prev = parseInt(localStorage.getItem(COUNT_KEY) || "0", 10);
    const count = (Number.isFinite(prev) ? prev : 0) + 1;
    localStorage.setItem(COUNT_KEY, String(count));
    this.#id = count;
    this.#winData = {
      id: count,
      shape: this.getWinShape(),
      metaData,
      seen: now,
    };
    existing.push(this.#winData);
    existing.sort(byId);
    this.#windows = existing;
    localStorage.setItem(WINDOWS_KEY, JSON.stringify(this.#windows));
  }

  getWinShape() {
    return {
      x: window.screenX,
      y: window.screenY,
      w: window.innerWidth,
      h: window.innerHeight,
    };
  }

  update() {
    if (!this.#winData) return;
    const shape = this.getWinShape();
    const prev = this.#winData.shape;
    const moved =
      shape.x !== prev.x || shape.y !== prev.y || shape.w !== prev.w || shape.h !== prev.h;
    const now = Date.now();
    if (!moved && now - this.#winData.seen < 500) return;
    this.#winData.shape = shape;
    this.#winData.seen = now;
    this.#persist();
  }

  setWinChangeCallback(callback) {
    this.#winChangeCallback = callback;
  }

  getWindows() {
    return this.#windows;
  }

  getThisWindowID() {
    return this.#id;
  }

  #persist() {
    const now = Date.now();
    const map = new Map(
      readList()
        .filter((win) => now - (win.seen || 0) < STALE_MS)
        .map((win) => [win.id, win]),
    );
    map.set(this.#id, this.#winData);
    const next = [...map.values()].sort(byId);
    this.#windows = next;
    const json = JSON.stringify(next);
    if (localStorage.getItem(WINDOWS_KEY) !== json) {
      localStorage.setItem(WINDOWS_KEY, json);
    }
  }

  #applyList(list) {
    const map = new Map(list.map((win) => [win.id, win]));
    if (this.#winData) map.set(this.#id, this.#winData);
    const now = Date.now();
    const next = [...map.values()]
      .filter((win) => win.id === this.#id || now - (win.seen || 0) < STALE_MS)
      .sort(byId);
    const before = this.#windows.map((win) => win.id).join(",");
    this.#windows = next;
    const after = next.map((win) => win.id).join(",");
    if (before !== after && this.#winChangeCallback) this.#winChangeCallback();
  }
}

function readList() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WINDOWS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function byId(a, b) {
  return a.id - b.id;
}
