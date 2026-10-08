// Controls for the original Entangled bundle.
// Chain and colors belong to this window. Number and quality reload both windows.
// The bundle reads quality once: particle count is 1.5e6 scaled from 0.2 to 1.
(function () {
	const SHARED_KEY = 'entangled-shared';
	const COLOR_KEY = 'entangled-colors';
	// Ethereum style id → Tezos URL number. Same Fisher-Yates as the bundle.
	const SHUFFLE = [1,179,25,83,57,21,124,46,80,231,34,91,43,24,242,221,130,81,176,161,129,86,122,64,175,131,144,38,164,209,196,58,184,55,47,9,145,202,151,76,32,73,100,159,17,253,107,93,95,169,207,37,216,103,116,136,7,96,139,29,33,191,226,189,138,50,236,250,23,71,4,214,181,222,200,133,53,14,180,13,192,183,5,108,52,224,150,210,84,182,142,20,172,113,69,12,74,62,141,212,27,157,15,167,92,54,123,220,87,232,60,109,206,229,118,140,240,215,104,99,174,45,16,166,245,185,115,137,188,247,234,148,6,147,41,98,39,18,199,235,223,246,162,82,101,187,97,168,177,154,105,243,119,171,112,248,217,173,228,10,51,205,3,102,170,66,238,63,85,193,160,19,197,94,22,35,256,106,111,195,219,114,194,132,239,233,252,72,120,11,249,149,254,40,56,158,251,30,213,134,88,153,225,61,198,125,230,227,152,48,190,8,44,241,31,117,68,126,208,204,59,79,135,90,42,201,121,128,2,155,110,211,203,163,28,156,70,127,89,36,218,165,65,75,146,143,186,255,244,237,78,26,67,49,77,178];
	const FROM_TEZOS = new Array(257);
	SHUFFLE.forEach((url, index) => { FROM_TEZOS[url] = index + 1; });

	function readQuery () { return new URLSearchParams(location.search); }
	function normQuality (value) {
		let n = parseFloat(value);
		if (!Number.isFinite(n)) n = 1;
		n = Math.min(1, Math.max(0.2, n));
		return (Math.round(n * 100) / 100).toFixed(2);
	}
	function wrapIter (n) {
		n = parseInt(n, 10);
		if (!n) n = 1;
		return ((n - 1) % 256 + 256) % 256 + 1;
	}
	function hex6 (n) { return (Number(n) >>> 0).toString(16).padStart(6, '0').slice(-6); }
	function tezosUrl (style) { return SHUFFLE[wrapIter(style) - 1]; }
	function styleFromTezos (url) { return FROM_TEZOS[wrapIter(url)] || 1; }
	function urlFor (style, chainIndex, shuffled) {
		return shuffled && chainIndex === 1 ? tezosUrl(style) : wrapIter(style);
	}
	function styleOf (url, chainIndex, shuffled) {
		return shuffled && chainIndex === 1 ? styleFromTezos(url) : wrapIter(url);
	}
	function compactQuery (query) {
		if (query.get('noshuffle') !== '1') query.delete('noshuffle');
		if (normQuality(query.get('quality')) === '1.00') query.delete('quality');
		return query;
	}
	function searchOf (query) {
		const next = query.toString();
		return next ? '?' + next : '';
	}

	// A sized window.open is a popup: no tab strip or bookmarks, so its page
	// starts higher than a normal window with the same outer top. Move it until
	// screenX/screenY — what the artwork uses — match the opener's viewport.
	(function alignViewport () {
		const query = readQuery();
		if (!query.has('viewY')) return;
		const targetX = Number(query.get('viewX'));
		const targetY = Number(query.get('viewY'));
		const targetW = Number(query.get('viewW'));
		const targetH = Number(query.get('viewH'));
		try {
			const dw = targetW - window.innerWidth;
			const dh = targetH - window.innerHeight;
			if (Number.isFinite(dw) && Number.isFinite(dh) && (Math.abs(dw) > 2 || Math.abs(dh) > 2)) {
				window.resizeBy(Math.round(dw), Math.round(dh));
			}
			for (let pass = 0; pass < 2; pass++) {
				const dx = targetX - window.screenX;
				const dy = targetY - window.screenY;
				if (!Number.isFinite(dx) || !Number.isFinite(dy)) break;
				if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) break;
				window.moveBy(Math.round(dx), Math.round(dy));
			}
		} catch (e) {}
		query.delete('viewX');
		query.delete('viewY');
		query.delete('viewW');
		query.delete('viewH');
		history.replaceState(null, '', location.pathname + '?' + query.toString());
	})();

	function openAligned (url, name, viewX) {
		const viewY = Math.round(window.screenY);
		const viewW = window.innerWidth;
		const viewH = window.innerHeight;
		const target = new URL(url, location.href);
		target.searchParams.set('viewX', String(Math.round(viewX)));
		target.searchParams.set('viewY', String(viewY));
		target.searchParams.set('viewW', String(viewW));
		target.searchParams.set('viewH', String(viewH));
		window.open(target.pathname + target.search, name, [
			'menubar=yes',
			'toolbar=yes',
			'location=yes',
			'status=yes',
			'resizable=yes',
			'scrollbars=yes',
			'width=' + viewW,
			'height=' + viewH,
			'left=' + Math.round(viewX),
			'top=' + viewY
		].join(','));
	}

	const initial = readQuery();
	const chainName = (initial.get('fxchain') || 'ETHEREUM').toLowerCase() === 'tezos' ? 'TEZOS' : 'ETHEREUM';
	const chainIdx = chainName === 'TEZOS' ? 1 : 0;
	const noshuffleOn = initial.get('noshuffle') === '1';
	const quality = normQuality(initial.get('quality'));
	const urlIter = wrapIter(initial.get('fxiteration') || 1);
	const resolved = styleOf(urlIter, chainIdx, !noshuffleOn);

	(function ensureQuery () {
		const query = readQuery();
		query.set('fxiteration', String(urlIter));
		query.set('fxchain', chainName);
		compactQuery(query);
		const next = searchOf(query);
		if (location.search !== next) history.replaceState(null, '', location.pathname + next);
	})();

	function readShared () {
		try { return JSON.parse(localStorage.getItem(SHARED_KEY) || 'null'); }
		catch (e) { return null; }
	}
	function reloadWith (changes, options) {
		const shared = options && options.shared;
		const dropColors = options && options.dropColors;
		const nextShuffle = changes.noshuffle != null ? changes.noshuffle === '1' || changes.noshuffle === 1 : noshuffleOn;
		const nextStyle = changes.resolved != null ? wrapIter(changes.resolved) : resolved;
		const nextChain = changes.fxchain || chainName;
		const nextChainIdx = nextChain === 'TEZOS' ? 1 : 0;
		const query = readQuery();
		const nextQuality = changes.quality != null ? normQuality(changes.quality) : quality;
		if (dropColors) query.delete('colors');
		query.set('fxiteration', String(urlFor(nextStyle, nextChainIdx, !nextShuffle)));
		query.set('fxchain', nextChain);
		if (nextShuffle) query.set('noshuffle', '1');
		else query.delete('noshuffle');
		if (nextQuality === '1.00') query.delete('quality');
		else query.set('quality', nextQuality);
		compactQuery(query);
		if (shared) {
			localStorage.setItem(SHARED_KEY, JSON.stringify({
				resolved: String(nextStyle),
				quality: nextQuality,
				nonce: Date.now()
			}));
		}
		const next = searchOf(query);
		if (location.search === next) return;
		location.search = next;
	}

	const paletteMats = [];
	let colorOverride = null;
	let colorSlots = ['colors0'];
	const Orig = THREE.ShaderMaterial;
	function paint (material, hexes, slots) {
		(slots || colorSlots).forEach((key) => {
			const list = material.uniforms[key] && material.uniforms[key].value;
			if (!list) return;
			hexes.forEach((hex, i) => {
				if (list[i]) list[i].setHex(parseInt(hex, 16));
			});
		});
	}
	THREE.ShaderMaterial = class extends Orig {
		constructor (...args) {
			super(...args);
			if (this.uniforms && this.uniforms.colors0 && this.uniforms.colors1) {
				paletteMats.push(this);
				if (colorOverride) paint(this, colorOverride);
			}
		}
	};
	function applyColors (hexes) {
		colorOverride = hexes.slice();
		paletteMats.forEach((material) => paint(material, hexes));
		if (hexes[0]) document.body.style.background = '#' + hexes[0];
	}

	let palettes = null;
	let swatches = [];
	function fileHexes () {
		if (!palettes || !palettes[resolved - 1]) return null;
		return palettes[resolved - 1][chainIdx].map(hex6);
	}
	function showFileColors () {
		const hexes = fileHexes();
		if (!hexes || !swatches.length) return;
		swatches.forEach((input, i) => { input.value = '#' + hexes[i]; });
	}
	function writeColors (hexes, slots) {
		if (slots) colorSlots = slots;
		const query = readQuery();
		query.set('colors', hexes.join(','));
		history.replaceState(null, '', location.pathname + '?' + query.toString());
		applyColors(hexes);
	}
	function publishColors (hexes) {
		localStorage.setItem(COLOR_KEY, JSON.stringify({ colors: hexes, nonce: Date.now() }));
	}
	function restoreColors () {
		const query = readQuery();
		query.delete('colors');
		history.replaceState(null, '', location.pathname + '?' + query.toString());
		colorOverride = null;
		colorSlots = ['colors0'];
		const hexes = fileHexes();
		const other = palettes && palettes[resolved - 1] ? palettes[resolved - 1][chainIdx === 0 ? 1 : 0].map(hex6) : null;
		paletteMats.forEach((material) => {
			if (hexes) paint(material, hexes, ['colors0']);
			if (other) paint(material, other, ['colors1']);
		});
		if (hexes && hexes[0]) document.body.style.background = '#' + hexes[0];
		showFileColors();
	}
	function adoptColors (rec) {
		if (!rec) return;
		if (rec.restore) {
			restoreColors();
			return;
		}
		if (!Array.isArray(rec.colors) || rec.colors.length !== 3) return;
		if (!rec.colors.every((hex) => /^[0-9a-f]{6}$/i.test(hex))) return;
		const hexes = rec.colors.map((hex) => hex.toLowerCase());
		swatches.forEach((input, i) => { input.value = '#' + hexes[i]; });
		writeColors(hexes, ['colors0', 'colors1']);
	}
	const savedColors = (initial.get('colors') || '').split(',');
	if (savedColors.length === 3 && savedColors.every((hex) => /^[0-9a-fA-F]{6}$/.test(hex))) {
		colorOverride = savedColors.map((hex) => hex.toLowerCase());
	}
	fetch('src/palettes.json').then((response) => response.json()).then((paletteFile) => {
		palettes = paletteFile;
		if (colorOverride) {
			swatches.forEach((input, i) => { input.value = '#' + colorOverride[i]; });
			applyColors(colorOverride);
		} else showFileColors();
	}).catch(() => {});

	if (initial.get('auto') === 'trio' && !initial.get('spawned')) {
		const sibs = ['fxchain=TEZOS&fxiteration=58&noshuffle=1', 'fxchain=ETHEREUM&fxiteration=41&noshuffle=1'];
		const connected = () => { try { return (JSON.parse(localStorage.getItem('windows')) || []).length; } catch (e) { return 1; } };
		const spawnSibs = () => {
			const w = window.innerWidth;
			sibs.forEach((q, i) => {
				const x = window.screenX + (i === 0 ? -(w + 25) : (w + 25));
				openAligned('./?' + q + '&spawned=1', 'sib' + i, Math.max(0, x));
			});
		};
		const overlay = document.createElement('div');
		overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:10000;color:#f3efe6;font:16px "DIN Alternate","Avenir Next Condensed",Futura,sans-serif;background:rgba(0,0,0,.55);cursor:pointer;text-align:center;padding:30px;line-height:1.7';
		overlay.onclick = () => { spawnSibs(); overlay.style.display = 'none'; setTimeout(() => { overlay.style.display = 'flex'; }, 2500); };
		window.addEventListener('DOMContentLoaded', () => {
			spawnSibs();
			setInterval(() => {
				const n = connected();
				if (n >= 3) { overlay.remove(); return; }
				overlay.textContent = n < 2 ? '点一下页面，打开另外两个窗口' : n + '/3 已连接。若开成了标签页，请把它们拖成独立窗口。';
				if (!overlay.parentNode && document.body) document.body.appendChild(overlay);
			}, 800);
		});
	}

	const style = document.createElement('style');
	style.textContent = [
		'#entangled-fps{position:fixed;top:10px;left:12px;z-index:9999;color:#d6ff4a;font:12px/1 "SF Mono",ui-monospace,monospace;letter-spacing:.08em;text-shadow:0 1px 2px #000;pointer-events:none}',
		'#entangled-dock{position:fixed;left:12px;bottom:12px;z-index:9999;width:36px;font-family:"DIN Alternate","Avenir Next Condensed",Futura,"Trebuchet MS",sans-serif;font-size:12px;letter-spacing:.12em;text-transform:uppercase;user-select:none}',
		'#entangled-dock.open{width:248px}',
		'#entangled-dock .fab{display:flex;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:1px solid rgba(214,255,74,.55);background:rgba(6,8,6,.4);color:#d6ff4a;opacity:.28;cursor:grab;box-shadow:none}',
		'#entangled-dock .fab:hover{opacity:.92}',
		'#entangled-dock .fab:active{cursor:grabbing}',
		'#entangled-dock.open .fab{display:none}',
		'#entangled-dock .panel{display:none}',
		'#entangled-dock.open .panel{display:block;padding:8px 10px;color:#e7e2d4;background:rgba(6,8,6,.78);border:1px solid rgba(198,214,170,.28);box-shadow:0 8px 24px rgba(0,0,0,.35)}',
		'#entangled-dock .grip{display:flex;align-items:center;justify-content:space-between;height:16px;margin:0 0 4px;cursor:grab;color:rgba(214,255,74,.55)}',
		'#entangled-dock .grip:active{cursor:grabbing}',
		'#entangled-dock .row{display:grid;grid-template-columns:52px 1fr;gap:8px;align-items:center;min-height:24px}',
		'#entangled-dock .k{color:#8d9a78}',
		'#entangled-dock .v{display:flex;align-items:center;gap:4px;min-width:0}',
		'#entangled-dock button{background:transparent;border:0;color:rgba(231,226,212,.62);font:inherit;letter-spacing:inherit;text-transform:inherit;padding:2px 4px;cursor:pointer}',
		'#entangled-dock button:hover{color:#fff}',
		'#entangled-dock button.on{color:#d6ff4a}',
		'#entangled-dock button.icon{display:inline-flex;align-items:center;padding:2px;color:rgba(231,226,212,.72)}',
		'#entangled-dock button.icon:hover{color:#d6ff4a}',
		'#entangled-dock .num{width:2.8em;height:18px;padding:0 2px;border:1px solid rgba(231,226,212,.5);background:rgba(0,0,0,.35);color:#e7e2d4;font:13px "SF Mono",ui-monospace,monospace;letter-spacing:0;text-align:center;text-transform:none}',
		'#entangled-dock .num:focus{outline:none;border-color:#d6ff4a;color:#fff}',
		'#entangled-dock .num::-webkit-inner-spin-button,#entangled-dock .num::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}',
		'#entangled-dock input[type=color]{-webkit-appearance:none;appearance:none;width:14px;height:14px;padding:0;border:1px solid rgba(231,226,212,.55);background:none;cursor:pointer}',
		'#entangled-dock input[type=color]::-webkit-color-swatch-wrapper{padding:0}',
		'#entangled-dock input[type=color]::-webkit-color-swatch{border:0}',
		'#entangled-dock input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:4px;margin:0;border-radius:2px;background:linear-gradient(#d6ff4a,#d6ff4a) 0/var(--q,100%) 100% no-repeat,rgba(231,226,212,.22);cursor:pointer}',
		'#entangled-dock input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:10px;height:10px;border:0;border-radius:0;background:#d6ff4a;cursor:pointer}',
		'#entangled-dock .qval{min-width:2.2em;text-align:right;font:12px "SF Mono",ui-monospace,monospace;letter-spacing:0;color:#d6ff4a}',
		'#entangled-dock .credit{margin-top:6px;padding-top:6px;border-top:1px solid rgba(198,214,170,.18);color:rgba(231,226,212,.5);font:11px/1.5 -apple-system,"PingFang SC",sans-serif;letter-spacing:0;text-transform:none}',
		'#entangled-dock .credit a{color:rgba(231,226,212,.75);text-decoration:underline}'
	].join('');
	document.documentElement.appendChild(style);

	const fps = document.createElement('div');
	fps.id = 'entangled-fps';
	fps.textContent = 'FPS --';

	const dock = document.createElement('div');
	dock.id = 'entangled-dock';
	function button (text, title, onClick) {
		const el = document.createElement('button');
		el.type = 'button';
		el.textContent = text;
		el.title = title || '';
		el.addEventListener('click', onClick);
		return el;
	}
	function mark (el, on) { el.classList.toggle('on', on); }
	function row (label) {
		const line = document.createElement('div');
		line.className = 'row';
		const key = document.createElement('span');
		key.className = 'k';
		key.textContent = label + ':';
		const value = document.createElement('div');
		value.className = 'v';
		line.append(key, value);
		return { line, value };
	}

	const chainRow = row('链');
	const ethBtn = button('以太坊', 'fxchain=ETHEREUM。只改这一扇', () => {
		if (chainName !== 'ETHEREUM') reloadWith({ fxchain: 'ETHEREUM' }, { dropColors: true });
	});
	const tezBtn = button('Tezos', 'fxchain=TEZOS。只改这一扇', () => {
		if (chainName !== 'TEZOS') reloadWith({ fxchain: 'TEZOS' }, { dropColors: true });
	});
	mark(ethBtn, chainName === 'ETHEREUM');
	mark(tezBtn, chainName === 'TEZOS');
	const openPair = button('', '打开另一条链。编号和质量相同', () => {
		const otherIdx = chainIdx === 0 ? 1 : 0;
		const query = readQuery();
		query.set('fxchain', otherIdx === 1 ? 'TEZOS' : 'ETHEREUM');
		query.set('fxiteration', String(urlFor(resolved, otherIdx, !noshuffleOn)));
		query.delete('colors');
		openAligned('./?' + query.toString(), 'pair-' + query.get('fxchain'), window.screenX + window.innerWidth + 24);
	});
	openPair.className = 'icon';
	openPair.setAttribute('aria-label', '打开另一条链');
	openPair.innerHTML = '<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M9 2h5v5h-1.4V4.4L7.2 9.8 6.2 8.8l5.4-5.4H9V2zM3 4h5v1.4H4.4v6.2h6.2V8H12v5H3V4z"/></svg>';
	chainRow.value.append(ethBtn, tezBtn, openPair);
	dock.appendChild(chainRow.line);

	const colorRow = row('配色');
	swatches = [0, 1, 2].map((index) => {
		const input = document.createElement('input');
		input.type = 'color';
		input.value = colorOverride ? '#' + colorOverride[index] : '#000000';
		input.title = '这一侧的第 ' + (index + 1) + ' 个颜色。立刻生效，只影响这一扇';
		input.addEventListener('input', () => {
			writeColors(swatches.map((item) => item.value.slice(1).toLowerCase()));
		});
		colorRow.value.appendChild(input);
		return input;
	});
	colorRow.value.appendChild(button('随机', '随机三种颜色，两扇一起换', () => {
		const hexes = [0, 1, 2].map(() => Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0'));
		swatches.forEach((input, i) => { input.value = '#' + hexes[i]; });
		writeColors(hexes, ['colors0', 'colors1']);
		publishColors(hexes);
	}));
	colorRow.value.appendChild(button('还原', '两扇都回到当前编号的配色', () => {
		restoreColors();
		localStorage.setItem(COLOR_KEY, JSON.stringify({ restore: true, nonce: Date.now() }));
	}));
	dock.appendChild(colorRow.line);

	const iterRow = row('编号');
	iterRow.value.appendChild(button('‹', '上一个编号，两扇一起换', () => {
		reloadWith({ resolved: wrapIter(resolved - 1) }, { shared: true, dropColors: true });
	}));
	const iterInput = document.createElement('input');
	iterInput.className = 'num';
	iterInput.type = 'number';
	iterInput.min = '1';
	iterInput.max = '256';
	iterInput.value = String(resolved);
	iterInput.title = '两扇用同一个编号才会连线';
	iterInput.addEventListener('change', () => {
		reloadWith({ resolved: wrapIter(iterInput.value) }, { shared: true, dropColors: true });
	});
	iterRow.value.appendChild(iterInput);
	iterRow.value.appendChild(button('›', '下一个编号，两扇一起换', () => {
		reloadWith({ resolved: wrapIter(resolved + 1) }, { shared: true, dropColors: true });
	}));
	dock.appendChild(iterRow.line);

	const qualityRow = row('质量');
	const qualityInput = document.createElement('input');
	qualityInput.type = 'range';
	qualityInput.min = '0.2';
	qualityInput.max = '1';
	qualityInput.step = '0.01';
	qualityInput.value = String(parseFloat(quality));
	qualityInput.title = '粒子数量从 20% 到 100%。低于 100% 会关掉抗锯齿和 2 倍内部分辨率。松开后两扇一起换';
	const qualityLabel = document.createElement('span');
	qualityLabel.className = 'qval';
	function paintQuality (value) {
		const n = parseFloat(value);
		qualityLabel.textContent = String(Math.round(n * 100));
		qualityInput.style.setProperty('--q', ((n - 0.2) / 0.8 * 100) + '%');
	}
	paintQuality(quality);
	qualityInput.addEventListener('input', () => paintQuality(qualityInput.value));
	qualityInput.addEventListener('change', () => {
		const next = normQuality(qualityInput.value);
		if (next !== quality) reloadWith({ quality: next }, { shared: true });
	});
	qualityRow.value.append(qualityInput, qualityLabel);
	dock.appendChild(qualityRow.line);

	const credit = document.createElement('div');
	credit.className = 'credit';
	credit.innerHTML = '非官方学习项目 · 原作 <a href="https://www.nonfigurativ.com/projects/entangled" target="_blank" rel="noopener">Bjørn Staal《Entangled》</a> · 版权归原作者';
	dock.appendChild(credit);

	const POS_KEY = 'entangled-dock-anchor';
	const OPEN_KEY = 'entangled-dock-open';
	const panel = document.createElement('div');
	panel.className = 'panel';
	while (dock.firstChild) panel.appendChild(dock.firstChild);
	const grip = document.createElement('div');
	grip.className = 'grip';
	grip.title = '拖动面板';
	grip.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M2 3h2v2H2zm5 0h2v2H7zm5 0h2v2h-2zM2 7h2v2H2zm5 0h2v2H7zm5 0h2v2h-2zM2 11h2v2H2zm5 0h2v2H7zm5 0h2v2h-2z"/></svg>';
	let anchor = null;
	let pinRight = false;
	let pinBottom = false;
	function clampBox (x, y, w, h) {
		const maxX = Math.max(8, window.innerWidth - w - 8);
		const maxY = Math.max(8, window.innerHeight - h - 8);
		return {
			x: Math.round(Math.min(maxX, Math.max(8, x))),
			y: Math.round(Math.min(maxY, Math.max(8, y)))
		};
	}
	function applyBox (x, y) {
		dock.style.left = x + 'px';
		dock.style.top = y + 'px';
		dock.style.bottom = 'auto';
	}
	function syncPin () {
		pinRight = anchor.x + 18 > window.innerWidth / 2;
		pinBottom = anchor.y + 18 > window.innerHeight / 2;
	}
	function layoutFromAnchor () {
		if (!anchor) return;
		if (!dock.classList.contains('open')) {
			const box = clampBox(anchor.x, anchor.y, 36, 36);
			anchor = box;
			applyBox(box.x, box.y);
			return;
		}
		const w = dock.offsetWidth || 248;
		const h = dock.offsetHeight || 36;
		const box = clampBox(
			pinRight ? anchor.x + 36 - w : anchor.x,
			pinBottom ? anchor.y + 36 - h : anchor.y,
			w,
			h
		);
		applyBox(box.x, box.y);
	}
	function rememberAnchor () {
		sessionStorage.setItem(POS_KEY, JSON.stringify(anchor));
	}
	function setOpen (open) {
		if (!anchor) {
			const rect = dock.getBoundingClientRect();
			anchor = { x: rect.left, y: rect.top };
		}
		if (open) syncPin();
		dock.classList.toggle('open', open);
		fab.setAttribute('aria-expanded', open ? 'true' : 'false');
		sessionStorage.setItem(OPEN_KEY, open ? '1' : '0');
		layoutFromAnchor();
	}
	const collapse = button('', '收起', () => setOpen(false));
	collapse.className = 'icon';
	collapse.setAttribute('aria-label', '收起');
	collapse.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M3 7h10v2H3z"/></svg>';
	grip.appendChild(collapse);
	panel.insertBefore(grip, panel.firstChild);
	const fab = document.createElement('button');
	fab.type = 'button';
	fab.className = 'fab';
	fab.title = '拖动，或点击展开';
	fab.setAttribute('aria-label', '打开控制面板');
	fab.setAttribute('aria-expanded', 'false');
	fab.innerHTML = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M2 3.2h12V4.6H2zm0 4h12v1.4H2zm0 4h12V13H2z"/></svg>';
	dock.append(fab, panel);
	function bindDrag (handle, onTap) {
		let originX = 0;
		let originY = 0;
		let startX = 0;
		let startY = 0;
		let moved = false;
		let active = false;
		handle.addEventListener('pointerdown', (event) => {
			if (event.button !== 0) return;
			const pressed = event.target.closest('button');
			if (pressed && pressed !== handle) return;
			active = true;
			moved = false;
			const rect = dock.getBoundingClientRect();
			originX = rect.left;
			originY = rect.top;
			startX = event.clientX;
			startY = event.clientY;
			try { handle.setPointerCapture(event.pointerId); } catch (e) {}
		});
		handle.addEventListener('pointermove', (event) => {
			if (!active) return;
			const dx = event.clientX - startX;
			const dy = event.clientY - startY;
			if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
			if (moved) {
				const w = dock.offsetWidth || 36;
				const h = dock.offsetHeight || 36;
				const box = clampBox(originX + dx, originY + dy, w, h);
				applyBox(box.x, box.y);
			}
		});
		function end () {
			if (!active) return;
			active = false;
			if (!moved) {
				if (onTap) onTap();
				return;
			}
			const rect = dock.getBoundingClientRect();
			if (dock.classList.contains('open')) {
				const box = clampBox(rect.left, rect.top, rect.width, rect.height);
				applyBox(box.x, box.y);
				anchor = clampBox(
					pinRight ? box.x + rect.width - 36 : box.x,
					pinBottom ? box.y + rect.height - 36 : box.y,
					36,
					36
				);
			} else {
				anchor = clampBox(rect.left, rect.top, 36, 36);
				applyBox(anchor.x, anchor.y);
				syncPin();
			}
			rememberAnchor();
		}
		handle.addEventListener('pointerup', end);
		handle.addEventListener('pointercancel', end);
	}
	bindDrag(fab, () => setOpen(true));
	bindDrag(grip, null);
	fab.addEventListener('click', (event) => event.preventDefault());

	let frames = 0;
	let last = performance.now();
	(function tick (now) {
		frames++;
		if (now - last >= 1000) {
			fps.textContent = 'FPS ' + Math.round(frames * 1000 / (now - last));
			frames = 0;
			last = now;
		}
		requestAnimationFrame(tick);
	})(performance.now());

	function adoptShared (rec) {
		if (!rec) return;
		const style = wrapIter(rec.resolved != null ? rec.resolved : rec.fxiteration);
		const nextQuality = normQuality(rec.quality);
		if (style === resolved && nextQuality === quality) return;
		reloadWith({
			resolved: style,
			quality: nextQuality
		}, { dropColors: style !== resolved });
	}

	let followTimer = 0;
	window.addEventListener('storage', (event) => {
		if (event.key === COLOR_KEY && event.newValue) {
			let colors = null;
			try { colors = JSON.parse(event.newValue); } catch (e) { return; }
			adoptColors(colors);
			return;
		}
		if (event.key !== SHARED_KEY || !event.newValue) return;
		let rec = null;
		try { rec = JSON.parse(event.newValue); } catch (e) { return; }
		clearTimeout(followTimer);
		followTimer = setTimeout(() => adoptShared(rec), 400);
	});

	window.addEventListener('DOMContentLoaded', () => {
		document.body.append(fps, dock);
		try {
			const saved = JSON.parse(sessionStorage.getItem(POS_KEY) || 'null');
			if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) anchor = { x: saved.x, y: saved.y };
		} catch (e) {}
		if (!anchor) {
			const rect = dock.getBoundingClientRect();
			anchor = { x: rect.left, y: rect.top };
		}
		syncPin();
		if (sessionStorage.getItem(OPEN_KEY) !== '0') {
			dock.classList.add('open');
			fab.setAttribute('aria-expanded', 'true');
		}
		layoutFromAnchor();
		const rec = readShared();
		if (rec && Date.now() - rec.nonce < 20000) adoptShared(rec);
	});
	window.addEventListener('keydown', (event) => {
		const typing = event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA');
		if (typing) return;
		if (event.key === 'ArrowLeft') reloadWith({ resolved: wrapIter(resolved - 1) }, { shared: true, dropColors: true });
		if (event.key === 'ArrowRight') reloadWith({ resolved: wrapIter(resolved + 1) }, { shared: true, dropColors: true });
		if ((event.key === '[' || event.key === ']') && palettes) {
			const source = wrapIter(resolved + (event.key === '[' ? -1 : 1));
			const hexes = palettes[source - 1][chainIdx].map(hex6);
			swatches.forEach((input, i) => { input.value = '#' + hexes[i]; });
			writeColors(hexes);
		}
	});
})();
