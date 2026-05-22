/* ───────────────────────────────────────────────────────────────────────────
   GOD VIEW · Controller
   Manages state transitions (title → atlas → node), wires labels,
   handles input + tweaks panel.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  const titleCard = document.getElementById('title-card');
  const conceptTitle = document.getElementById('concept-title');
  const bc1 = document.getElementById('bc-line1');
  const bc2 = document.getElementById('bc-line2');
  const stateButtons = document.querySelectorAll('#states button');

  let state = 'title';
  let labelObjs = []; // tracked label objects (for refreshAnchors)

  // ── Helpers ───────────────────────────────────────────────────────────
  function clearLabels() {
    window.LABELS.clear();
    labelObjs = [];
  }

  function setBreadcrumb(line1, line2) {
    bc1.textContent = line1;
    bc2.textContent = line2;
  }

  function setActiveBtn(name) {
    stateButtons.forEach((b) =>
      b.classList.toggle('active', b.dataset.state === name),
    );
  }

  // ── Region labels (atlas view) ──────────────────────────────────────
  let hoveredRegion = null;
  let domainLabelObjs = []; // domain whisker labels, swapped on hover

  // Fixed perimeter positions (% of viewport) + alignment per region.
  const REGION_LAYOUT = {
    foundations: { x: 6,  y: 24, align: 'left'  },
    storage:     { x: 6,  y: 56, align: 'left'  },
    data:        { x: 6,  y: 84, align: 'left'  },
    ml:          { x: 94, y: 84, align: 'right' },
    devops:      { x: 94, y: 56, align: 'right' },
    genai:       { x: 94, y: 24, align: 'right' },
  };

  function showRegionLabels() {
    clearLabels();
    domainLabelObjs = [];
    window.ATLAS.REGIONS.forEach((reg) => {
      const center = window.SCENE.regionAnchors[reg.id];
      const layout = REGION_LAYOUT[reg.id];
      const el = document.createElement('div');
      el.className = 'lbl lbl-region';
      el.setAttribute('data-fade', 'in');
      el.dataset.region = reg.id;
      el.innerHTML = `
        <div class="lbl-inner">
          <span class="num">${reg.n}</span><span class="name">${reg.name}</span><span class="enter">ENTER →</span>
          <span class="tag">${reg.tagline}</span>
        </div>
      `;
      el.addEventListener('mouseenter', () => {
        hoveredRegion = reg.id;
        window.SCENE.focusRegion(reg.id);
        el.classList.add('is-active');
        showDomainLabelsForRegion(reg.id);
      });
      el.addEventListener('mouseleave', () => {
        hoveredRegion = null;
        window.SCENE.focusRegion(null);
        el.classList.remove('is-active');
        clearDomainLabels();
      });
      el.addEventListener('click', () => {
        diveToRegion(reg.id);
      });

      const obj = window.LABELS.add({
        el,
        anchor: center.clone(),
        hairAnchor: center.clone(),
        fixed: [layout.x, layout.y],
        align: layout.align,
      });
      labelObjs.push(obj);
    });
  }

  // ── Domain whisker labels (only on region hover) ────────────────────
  function clearDomainLabels() {
    domainLabelObjs.forEach((o) => {
      if (o.el && o.el.parentNode) o.el.parentNode.removeChild(o.el);
      if (o.lineEl && o.lineEl.parentNode) o.lineEl.parentNode.removeChild(o.lineEl);
    });
    domainLabelObjs = [];
  }

  function showDomainLabelsForRegion(regionId) {
    clearDomainLabels();
    window.SCENE.domainPositions.forEach((d) => {
      if (d.region !== regionId) return;
      const el = document.createElement('div');
      el.className = 'lbl lbl-domain';
      el.textContent = d.name;
      el.setAttribute('data-fade', 'in');
      const obj = window.LABELS.add({
        el,
        anchor: d.pos.clone(),
        radial: 24,
      });
      domainLabelObjs.push(obj);
    });
  }

  function showDomainLabels() {}

  // ── Concept-detail labels (node view) ────────────────────────────────
  function showConceptLabels() {
    clearLabels();
    const c = window.ATLAS.FEATURED_CONCEPT;
    const fields = window.SCENE.getConceptFields();
    const center = window.SCENE.getConceptCenter();

    // Big serif headline column on the left.
    conceptTitle.innerHTML = `
      <div class="lbl-title">
        ${c.name}
        <span class="sub">${c.region.toUpperCase()} · ${c.domain.toUpperCase()}</span>
        <span class="lede">${c.short}</span>
      </div>
    `;
    conceptTitle.classList.add('shown');

    // Five field callouts in a clean right column.
    // Each callout has its own row; hairlines reach to the corresponding
    // satellite particle inside the cluster.
    const yPositions = [22, 36, 50, 64, 80];
    fields.forEach((f, i) => {
      const el = document.createElement('div');
      el.className = 'lbl lbl-callout';
      el.setAttribute('data-fade', 'in');
      el.innerHTML = `
        <div class="head"><span class="n">${f.field.n}</span><span>${f.field.kind}</span></div>
        <div class="body">${f.field.body}</div>
      `;
      const obj = window.LABELS.add({
        el,
        anchor: f.anchor.clone(),
        hairAnchor: f.anchor.clone(),
        fixed: [94, yPositions[i] || 50],
        align: 'right',
        hairClass: 'mint-hair',
      });
      labelObjs.push(obj);
    });

    // Faint "core" pin just under the cluster
    const pin = document.createElement('div');
    pin.className = 'lbl lbl-domain featured';
    pin.textContent = `${c.name.toUpperCase()} · CORE`;
    pin.setAttribute('data-fade', 'in');
    const pinObj = window.LABELS.add({
      el: pin,
      anchor: center.clone().add(new THREE.Vector3(0, -7, 0)),
      offset: [0, 14],
    });
    labelObjs.push(pinObj);
  }

  function hideConceptTitle() {
    conceptTitle.classList.remove('shown');
    conceptTitle.innerHTML = '';
  }

  // ── State transitions ────────────────────────────────────────────────
  function goTitle() {
    state = 'title';
    setActiveBtn('title');
    titleCard.classList.remove('hidden');
    window.SCENE.setPose('atlas');
    window.SCENE.focusRegion(null);
    clearLabels();
    hideConceptTitle();
    setBreadcrumb('GOD VIEW · TITLE', 'An Atlas of Modern Engineering, Vol. I');
    document.getElementById('back-btn').classList.remove('shown');
    document.getElementById('orbit-ring').classList.remove('shown');
  }

  function goAtlas() {
    state = 'atlas';
    setActiveBtn('atlas');
    titleCard.classList.add('hidden');
    window.SCENE.setPose('atlas');
    window.SCENE.focusRegion(null);
    hideConceptTitle();
    clearLabels();
    showRegionLabels();
    setBreadcrumb('REGION · OVERVIEW', 'Six regions of modern engineering');
    document.getElementById('back-btn').classList.remove('shown');
    document.getElementById('orbit-ring').classList.remove('shown');
  }

  function goNode(regionId) {
    state = 'node';
    setActiveBtn('node');
    titleCard.classList.add('hidden');
    window.SCENE.setPose('node');
    window.SCENE.focusRegion(null);
    setTimeout(() => {
      showConceptLabels();
    }, 30);
    const reg = window.ATLAS.REGIONS.find((r) => r.id === regionId) ||
                window.ATLAS.REGIONS.find((r) => r.id === 'storage');
    if (regionId === 'storage' || !regionId) {
      setBreadcrumb(
        `${reg.name} ${reg.n} · DATABASES · TRANSACTIONS`,
        'ACID transactions — atomicity · consistency · isolation · durability',
      );
    } else {
      setBreadcrumb(
        `${reg.name} ${reg.n}`,
        'Detail preview · full content available in this prototype for Storage',
      );
    }
    document.getElementById('back-btn').classList.add('shown');
    document.getElementById('orbit-ring').classList.add('shown');
  }

  function diveToNode() {
    goNode('storage');
  }

  function diveToRegion(regionId) {
    goNode(regionId);
  }

  function flashHint(msg) {
    bc2.textContent = msg;
    setTimeout(() => {
      if (state === 'atlas') bc2.textContent = 'Six regions of modern engineering';
    }, 2200);
  }

  // ── Auto-advance from title to atlas after ~3.4s ─────────────────────
  setTimeout(() => {
    if (state === 'title') goAtlas();
  }, 7000);

  // ── State switcher ───────────────────────────────────────────────────
  stateButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = btn.dataset.state;
      if (s === 'title') goTitle();
      else if (s === 'atlas') goAtlas();
      else if (s === 'node') goNode();
    });
  });

  // ── Keyboard ─────────────────────────────────────────────────────────
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state === 'node') goAtlas();
      else if (state === 'atlas') goTitle();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (state === 'title') goAtlas();
    }
  });

  // ── Click on canvas — region picking in atlas view ──────────────────
  document.getElementById('scene-canvas').addEventListener('click', (e) => {
    if (state !== 'atlas') return;
    const reg = window.SCENE.pickRegionAt(e.clientX, e.clientY);
    if (reg) diveToRegion(reg);
  });

  // Back button click
  document.getElementById('back-btn').addEventListener('click', () => {
    if (state === 'node') goAtlas();
  });

  // ── Tweaks panel ─────────────────────────────────────────────────────
  const tweaksBtn = document.getElementById('tweaks-btn');
  const tweaks = document.getElementById('tweaks');
  let tweaksOpen = false;

  function setTweaksOpen(open) {
    tweaksOpen = open;
    tweaks.classList.toggle('open', open);
    tweaksBtn.classList.toggle('active', open);
  }

  // ── Edit-mode protocol (toolbar Tweaks toggle) ───────────────────────
  window.addEventListener('message', (ev) => {
    const data = ev && ev.data;
    if (!data || !data.type) return;
    if (data.type === '__activate_edit_mode') {
      tweaksBtn.style.display = 'inline-block';
      setTweaksOpen(true);
    } else if (data.type === '__deactivate_edit_mode') {
      setTweaksOpen(false);
      tweaksBtn.style.display = 'none';
    }
  });
  try {
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
  } catch (_) {}

  // Internal Tweaks button toggles (visible only when toolbar enabled)
  tweaksBtn.addEventListener('click', () => {
    setTweaksOpen(!tweaksOpen);
    if (!tweaksOpen) {
      try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (_) {}
    }
  });

  // Swatches
  const acName = document.getElementById('ac-name');
  const acNames = {
    '#5EEAB7': 'MINT',
    '#FFC65A': 'AMBER',
    '#FF7A6B': 'CORAL',
    '#9D8CFF': 'IRIS',
    '#FFFFFF': 'WHITE',
  };
  document.querySelectorAll('#ac-swatches .sw').forEach((sw) => {
    sw.addEventListener('click', () => {
      const color = sw.dataset.color;
      document.querySelectorAll('#ac-swatches .sw').forEach((s) =>
        s.classList.toggle('active', s === sw),
      );
      acName.textContent = acNames[color] || color;
      window.SCENE.setColor(color);
    });
  });

  // Density slider
  const dRange = document.getElementById('d-range');
  const dVal = document.getElementById('d-val');
  let densityDebounce = null;
  dRange.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    dVal.textContent = v.toFixed(2) + '×';
    if (densityDebounce) clearTimeout(densityDebounce);
    densityDebounce = setTimeout(() => {
      window.SCENE.setDensity(v);
    }, 120);
  });

  // Drift toggle
  document.querySelectorAll('#drift-toggle button').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#drift-toggle button').forEach((x) =>
        x.classList.toggle('active', x === b),
      );
      window.SCENE.setDrift(b.dataset.v === 'on');
    });
  });

  // Grain toggle
  document.querySelectorAll('#grain-toggle button').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#grain-toggle button').forEach((x) =>
        x.classList.toggle('active', x === b),
      );
      window.SCENE.setGrain(b.dataset.v === 'on');
    });
  });

  // ── refreshAnchors — re-add labels after density rebuild ─────────────
  function refreshAnchors() {
    // Re-emit labels for the current state to point at fresh anchors.
    if (state === 'atlas') {
      clearLabels();
      showRegionLabels();
    } else if (state === 'node') {
      showConceptLabels();
    }
  }

  // ── Palette toggle (Mint / Iris) ─────────────────────────────────────
  const PALETTES = {
    mint: '#5EEAB7',
    iris: '#B5A0FF',
  };
  const PALETTE_KEY = 'godview.palette.v1';

  function applyPalette(id) {
    const hex = PALETTES[id] || PALETTES.mint;
    window.SCENE.setColor(hex);
    // Update toggle button states
    document.querySelectorAll('#palette-toggle button').forEach((b) =>
      b.classList.toggle('active', b.dataset.palette === id),
    );
    try { localStorage.setItem(PALETTE_KEY, id); } catch (_) {}
  }

  document.querySelectorAll('#palette-toggle button').forEach((b) => {
    b.addEventListener('click', () => applyPalette(b.dataset.palette));
  });

  // Restore palette on load
  try {
    const saved = localStorage.getItem(PALETTE_KEY);
    if (saved && PALETTES[saved]) applyPalette(saved);
  } catch (_) {}

  window.CONTROLLER = {
    refreshAnchors,
    goTitle, goAtlas, goNode,
  };
})();
