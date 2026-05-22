/* ───────────────────────────────────────────────────────────────────────────
   Label projection layer.
   Renders DOM labels that follow 3D anchor points each frame.
   Labels are added/removed by the controller; this module just keeps them
   on screen and exposes a tiny SVG hairline layer for connections.
   ─────────────────────────────────────────────────────────────────────────── */
window.LABELS = (function () {
  const root = document.getElementById('labels');
  const lines = document.getElementById('lines');
  const stage = document.getElementById('stage');

  const tracked = []; // { el, anchor: THREE.Vector3, hairAnchor?: THREE.Vector3, lineEl? }

  function size() {
    return { w: stage.clientWidth, h: stage.clientHeight };
  }

  function ensureSvgSize() {
    const { w, h } = size();
    lines.setAttribute('viewBox', `0 0 ${w} ${h}`);
    lines.setAttribute('width', w);
    lines.setAttribute('height', h);
  }
  ensureSvgSize();
  window.addEventListener('resize', ensureSvgSize);

  function project(anchor, camera) {
    const v = anchor.clone().project(camera);
    const { w, h } = size();
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
      z: v.z, // for visibility test
    };
  }

  function add({ el, anchor, hairAnchor, offset, radial, fixed, hairClass, align }) {
    root.appendChild(el);
    let lineEl = null;
    if (hairAnchor) {
      lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineEl.setAttribute('class', hairClass || 'hair');
      lines.appendChild(lineEl);
    }
    const obj = {
      el, anchor, hairAnchor, lineEl,
      offset: offset || [0, 0],
      radial: radial || 0,
      fixed: fixed || null,
      align: align || 'center',
    };
    tracked.push(obj);
    return obj;
  }

  function clear() {
    for (const t of tracked) {
      if (t.el && t.el.parentNode) t.el.parentNode.removeChild(t.el);
      if (t.lineEl && t.lineEl.parentNode) t.lineEl.parentNode.removeChild(t.lineEl);
    }
    tracked.length = 0;
  }

  function update(camera) {
    const { w, h } = size();
    const cx = w / 2, cy = h / 2;
    for (const t of tracked) {
      let fx, fy, visible = true;

      if (t.fixed) {
        // Fixed position in % of viewport
        fx = (t.fixed[0] / 100) * w + (t.offset[0] || 0);
        fy = (t.fixed[1] / 100) * h + (t.offset[1] || 0);
      } else {
        const p = project(t.anchor, camera);
        visible = p.z < 1.0;
        fx = p.x; fy = p.y;
        if (t.radial > 0) {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          fx += (dx / len) * t.radial;
          fy += (dy / len) * t.radial;
        }
        fx += t.offset[0];
        fy += t.offset[1];

        // Clamp inset so labels never go off-screen
        const inset = 40;
        const halfW = (t.el.offsetWidth || 100) / 2;
        const halfH = (t.el.offsetHeight || 30) / 2;
        fx = Math.max(inset + halfW, Math.min(w - inset - halfW, fx));
        fy = Math.max(inset + halfH, Math.min(h - inset - halfH, fy));
      }

      // Alignment determines transform origin
      let ax = '-50%', ay = '-50%';
      if (t.align === 'left')  ax = '0';
      if (t.align === 'right') ax = '-100%';
      if (t.align === 'top')    ay = '0';
      if (t.align === 'bottom') ay = '-100%';

      t.el.style.opacity = visible ? '1' : '0';
      t.el.style.transform =
        `translate(${ax}, ${ay}) ` +
        `translate(${fx}px, ${fy}px)`;

      if (t.lineEl && t.hairAnchor) {
        const a = project(t.hairAnchor, camera);
        const anchorVisible = a.z < 1.0;
        // Hairline endpoint: connect to the nearest edge of the label, not its center.
        const elW = t.el.offsetWidth || 100;
        const elH = t.el.offsetHeight || 30;
        let edgeX = fx, edgeY = fy;
        if (t.align === 'left')  edgeX = fx;             // anchor left edge
        else if (t.align === 'right') edgeX = fx;        // anchor right edge — element grows leftward
        else edgeX = fx; // center; just use middle
        // Vertical: meet at vertical center of the label box
        if (t.align === 'left' || t.align === 'right' || t.align === 'center') {
          // do nothing, edgeY = fy
        }
        // Shorten hairline so it doesn't enter the label box
        const dx = edgeX - a.x;
        const dy = edgeY - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const padApprox = (t.align === 'left' || t.align === 'right') ? elW * 0.0 : Math.min(elW, elH) * 0.4;
        const x2 = edgeX - (dx / len) * padApprox;
        const y2 = edgeY - (dy / len) * padApprox;
        t.lineEl.setAttribute('x1', a.x);
        t.lineEl.setAttribute('y1', a.y);
        t.lineEl.setAttribute('x2', x2);
        t.lineEl.setAttribute('y2', y2);
        t.lineEl.style.opacity = (visible && anchorVisible) ? '' : '0';
      }
    }
  }

  return { add, clear, update };
})();
