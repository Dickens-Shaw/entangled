// Controls for the homepage. The artwork in demos/ is left untouched and
// bakes each fxiteration at startup, so a change reloads this page.
// The other window hears the next iteration through localStorage.

const SYNC_KEY = "entangled-iteration";

const params = new URLSearchParams(location.search);
const iter = ((parseInt(params.get("fxiteration"), 10) || 1) - 1 + 256) % 256 + 1;
const chain = (params.get("fxchain") || "TEZOS").toUpperCase() === "ETHEREUM" ? "ETHEREUM" : "TEZOS";

function goTo(n) {
  const next = ((n - 1 + 256) % 256) + 1;
  params.set("fxchain", chain);
  params.set("noshuffle", "1");
  params.set("fxiteration", String(next));
  location.search = params.toString();
}

function openPair() {
  const sibling = chain === "TEZOS" ? "ETHEREUM" : "TEZOS";
  const query = `fxchain=${sibling}&noshuffle=1&fxiteration=${iter}`;
  const left = Math.max(0, window.screenX + window.outerWidth + 24);
  window.open(
    `${location.pathname}?${query}`,
    `entangled-${sibling}`,
    `popup=yes,width=${window.innerWidth},height=${window.innerHeight},left=${left},top=${window.screenY}`,
  );
}

function switchBoth() {
  const next = (iter % 256) + 1;
  localStorage.setItem(SYNC_KEY, JSON.stringify({ iteration: next, nonce: Date.now() }));
  goTo(next);
}

window.addEventListener("storage", (event) => {
  if (event.key !== SYNC_KEY || !event.newValue) return;
  let next = 0;
  try {
    next = JSON.parse(event.newValue).iteration;
  } catch {
    return;
  }
  if (!next || next === iter) return;
  goTo(next);
});

const bar = document.createElement("div");
bar.style.cssText = [
  "position:fixed",
  "bottom:14px",
  "left:14px",
  "z-index:9999",
  "display:flex",
  "gap:6px",
  "align-items:center",
  "font:13px 'Courier New',monospace",
  "color:#ccc",
  "background:rgba(0,0,0,.55)",
  "border:1px solid rgba(255,255,255,.2)",
  "border-radius:8px",
  "padding:6px 10px",
  "user-select:none",
].join(";");

function button(label, onClick, title) {
  const el = document.createElement("button");
  el.type = "button";
  el.textContent = label;
  el.title = title;
  el.style.cssText = [
    "background:none",
    "border:1px solid rgba(255,255,255,.25)",
    "color:#ccc",
    "border-radius:5px",
    "cursor:pointer",
    "font:13px 'Courier New',monospace",
    "padding:4px 10px",
  ].join(";");
  el.addEventListener("click", onClick);
  bar.appendChild(el);
}

button("Open pair", openPair, "Open the other chain at this same iteration");
button(`切换 ${iter}`, switchBoth, "Reload both windows on the next iteration");

document.body.appendChild(bar);
