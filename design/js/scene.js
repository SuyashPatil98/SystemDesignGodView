/* ───────────────────────────────────────────────────────────────────────────
   GOD VIEW · Scene
   Mint-mono particle atlas. Pure Three.js (no modules), additive blending,
   custom circular point sprite, three camera poses.
   ─────────────────────────────────────────────────────────────────────────── */
window.SCENE = (function () {
  const canvas = document.getElementById('scene-canvas');
  const stage = document.getElementById('stage');

  // ── Renderer ──────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);

  // ── Scene & camera ────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0055);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
  camera.position.set(0, 0, 175);
  camera.lookAt(0, 0, 0);

  function setSize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  setSize();
  window.addEventListener('resize', setSize);

  // ── Circular point sprite (canvas-generated) ──────────────────────────
  function makeSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,    'rgba(255,255,255,1)');
    grad.addColorStop(0.18, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1,    'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter;
    return t;
  }
  const sprite = makeSprite();

  // ── Palette ────────────────────────────────────────────────────────────
  let mint = new THREE.Color('#5EEAB7');
  const dust = new THREE.Color('#5EEAB7');

  // ── Layout helpers ────────────────────────────────────────────────────
  function fibSphere(n, r, jitter = 0) {
    // Returns array of THREE.Vector3 evenly distributed on a sphere of radius r.
    const pts = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      pts.push(new THREE.Vector3(
        x * r + (Math.random() - 0.5) * jitter,
        y * r + (Math.random() - 0.5) * jitter,
        z * r + (Math.random() - 0.5) * jitter,
      ));
    }
    return pts;
  }

  function gaussian3(scale) {
    // Box-Muller pair → x,y; another for z
    function bm() {
      const u = Math.random() || 1e-9;
      const v = Math.random() || 1e-9;
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    return new THREE.Vector3(bm() * scale, bm() * scale, bm() * scale);
  }

  // ── Build particle clouds per region ──────────────────────────────────
  // Each region cloud has 3 layers:
  //   core (dense, bright)  – ~80 pts
  //   mid (medium)          – ~280 pts
  //   halo (sparse atmosphere) – ~700 pts
  // Plus a small set of "node" particles per domain.

  const regionMeshes = {};
  const regionCenters = {};
  const regionAnchors = {};   // central anchor for labels
  const domainPositions = []; // for the node-detail view
  let densityScale = 1.0;
  let driftOn = true;

  function buildRegion(reg) {
    const center = new THREE.Vector3(...window.ATLAS.REGION_CENTERS[reg.id]);
    regionCenters[reg.id] = center.clone();
    regionAnchors[reg.id] = center.clone();

    const positions = [];
    const sizes = [];
    const brightness = [];
    const driftSeed = [];

    // Core — tight, bright
    const coreN = Math.round(70 * densityScale);
    for (let i = 0; i < coreN; i++) {
      const p = gaussian3(2.2).add(center);
      positions.push(p.x, p.y, p.z);
      sizes.push(1.6 + Math.random() * 0.8);
      brightness.push(0.9 + Math.random() * 0.1);
      driftSeed.push(Math.random() * 6.28);
    }
    // Mid — spread
    const midN = Math.round(240 * densityScale);
    for (let i = 0; i < midN; i++) {
      const p = gaussian3(6.5).add(center);
      positions.push(p.x, p.y, p.z);
      sizes.push(0.9 + Math.random() * 0.7);
      brightness.push(0.55 + Math.random() * 0.3);
      driftSeed.push(Math.random() * 6.28);
    }
    // Halo — sparse atmosphere
    const haloN = Math.round(620 * densityScale);
    for (let i = 0; i < haloN; i++) {
      const p = gaussian3(13).add(center);
      positions.push(p.x, p.y, p.z);
      sizes.push(0.5 + Math.random() * 0.6);
      brightness.push(0.18 + Math.random() * 0.22);
      driftSeed.push(Math.random() * 6.28);
    }

    // Domain particles — slightly brighter, larger, with named anchors.
    const domAngles = reg.domains.length;
    reg.domains.forEach((dname, di) => {
      const ang = (di / domAngles) * Math.PI * 2;
      const r = 5.5 + Math.random() * 2;
      const tilt = (Math.random() - 0.5) * 5;
      const dp = new THREE.Vector3(
        center.x + Math.cos(ang) * r,
        center.y + tilt + Math.sin(ang) * r * 0.45,
        center.z + Math.sin(ang) * r,
      );
      positions.push(dp.x, dp.y, dp.z);
      sizes.push(2.4);
      brightness.push(1.0);
      driftSeed.push(Math.random() * 6.28);
      domainPositions.push({ region: reg.id, name: dname, pos: dp });
    });

    // Build geometry
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geom.setAttribute('aBright', new THREE.Float32BufferAttribute(brightness, 1));
    geom.setAttribute('aSeed', new THREE.Float32BufferAttribute(driftSeed, 1));

    const mat = makePointsMaterial();
    const points = new THREE.Points(geom, mat);
    points.userData = { region: reg.id, baseSizes: sizes };
    scene.add(points);
    regionMeshes[reg.id] = points;
  }

  // ── Ambient dust (background, very dim) ───────────────────────────────
  let dustMesh = null;
  function buildDust() {
    if (dustMesh) {
      scene.remove(dustMesh);
      dustMesh.geometry.dispose();
    }
    const n = Math.round(4500 * densityScale);
    const positions = [];
    const sizes = [];
    const brightness = [];
    const driftSeed = [];

    for (let i = 0; i < n; i++) {
      // Distribute in a thick spherical shell
      const r = 60 + Math.random() * 110;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      sizes.push(0.45 + Math.random() * 0.45);
      brightness.push(0.08 + Math.random() * 0.18);
      driftSeed.push(Math.random() * 6.28);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geom.setAttribute('aBright', new THREE.Float32BufferAttribute(brightness, 1));
    geom.setAttribute('aSeed', new THREE.Float32BufferAttribute(driftSeed, 1));
    const mat = makePointsMaterial({ dust: true });
    dustMesh = new THREE.Points(geom, mat);
    scene.add(dustMesh);
  }

  // ── Concept-detail particle set (only built when entering node view) ──
  let conceptGroup = null; // THREE.Group containing the concept's particle cluster + relations
  let conceptCore = null;  // The selected concept particle (anchor)
  let conceptFieldAnchors = []; // anchors for each field label

  function buildConceptView() {
    if (conceptGroup) {
      scene.remove(conceptGroup);
      conceptGroup.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      conceptGroup = null;
      conceptFieldAnchors = [];
    }

    const c = window.ATLAS.FEATURED_CONCEPT;
    const center = new THREE.Vector3(0, 0, 0);
    conceptGroup = new THREE.Group();
    scene.add(conceptGroup);

    // Central glow cluster (the concept itself)
    {
      const positions = [], sizes = [], brightness = [], driftSeed = [];
      const coreN = 90;
      for (let i = 0; i < coreN; i++) {
        const p = gaussian3(0.8).add(center);
        positions.push(p.x, p.y, p.z);
        sizes.push(1.4 + Math.random() * 0.8);
        brightness.push(0.95 + Math.random() * 0.05);
        driftSeed.push(Math.random() * 6.28);
      }
      const ringN = 350;
      for (let i = 0; i < ringN; i++) {
        const t = Math.random() * Math.PI * 2;
        const r = 2.6 + Math.random() * 1.6;
        const y = (Math.random() - 0.5) * 0.7;
        positions.push(center.x + Math.cos(t) * r, center.y + y, center.z + Math.sin(t) * r);
        sizes.push(0.7 + Math.random() * 0.6);
        brightness.push(0.55 + Math.random() * 0.25);
        driftSeed.push(Math.random() * 6.28);
      }
      const haloN = 700;
      for (let i = 0; i < haloN; i++) {
        const p = gaussian3(5.5).add(center);
        positions.push(p.x, p.y, p.z);
        sizes.push(0.5 + Math.random() * 0.5);
        brightness.push(0.18 + Math.random() * 0.18);
        driftSeed.push(Math.random() * 6.28);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
      geom.setAttribute('aBright', new THREE.Float32BufferAttribute(brightness, 1));
      geom.setAttribute('aSeed', new THREE.Float32BufferAttribute(driftSeed, 1));
      const mat = makePointsMaterial();
      const points = new THREE.Points(geom, mat);
      conceptGroup.add(points);
      conceptCore = points;
    }

    // Five field satellites — radially distributed around the cluster in XY.
    const radius = 9;
    const angles = [
      Math.PI * 0.18,   // upper-right
      Math.PI * 1.85,   // right
      Math.PI * 1.55,   // lower-right
      Math.PI * 1.18,   // lower-left
      Math.PI * 0.78,   // upper-left
    ];

    c.fields.forEach((f, i) => {
      const a = angles[i] || 0;
      const p = new THREE.Vector3(
        center.x + Math.cos(a) * radius,
        center.y + Math.sin(a) * radius,
        center.z + (Math.random() - 0.5) * 2,
      );
      // small cluster
      const positions = [], sizes = [], brightness = [], driftSeed = [];
      const n = 60;
      for (let j = 0; j < n; j++) {
        const q = gaussian3(0.85).add(p);
        positions.push(q.x, q.y, q.z);
        sizes.push(0.75 + Math.random() * 0.65);
        brightness.push(0.5 + Math.random() * 0.3);
        driftSeed.push(Math.random() * 6.28);
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
      geom.setAttribute('aBright', new THREE.Float32BufferAttribute(brightness, 1));
      geom.setAttribute('aSeed', new THREE.Float32BufferAttribute(driftSeed, 1));
      const mat = makePointsMaterial();
      const points = new THREE.Points(geom, mat);
      conceptGroup.add(points);
      conceptFieldAnchors.push({ field: f, anchor: p });
    });

    return { center, fields: conceptFieldAnchors };
  }

  // ── Custom point material ─────────────────────────────────────────────
  function makePointsMaterial({ dust: isDust = false } = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime:    { value: 0 },
        uSprite:  { value: sprite },
        uPixel:   { value: renderer.getPixelRatio() },
        uColor:   { value: isDust ? mint.clone().multiplyScalar(0.55) : mint.clone() },
        uDrift:   { value: 1.0 },
        uOpacity: { value: isDust ? 0.7 : 1.0 },
        uSizeMul: { value: isDust ? 0.9 : 1.0 },
        uGlobalAlpha: { value: 1.0 }, // for fading out a region during transitions
        uExtraDim: { value: 1.0 }, // dim other regions when one focused
      },
      vertexShader: `
        attribute float aSize;
        attribute float aBright;
        attribute float aSeed;
        uniform float uTime;
        uniform float uPixel;
        uniform float uDrift;
        uniform float uSizeMul;
        varying float vBright;

        void main() {
          vBright = aBright;
          // Gentle 3D drift — slow sine waves per particle
          vec3 p = position;
          float t = uTime * 0.00035;
          p.x += sin(t + aSeed) * 0.55 * uDrift;
          p.y += cos(t * 0.78 + aSeed * 1.7) * 0.42 * uDrift;
          p.z += sin(t * 0.61 + aSeed * 2.3) * 0.48 * uDrift;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uSizeMul * uPixel * (260.0 / -mv.z);
        }
      `,
      fragmentShader: `
        uniform sampler2D uSprite;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uGlobalAlpha;
        uniform float uExtraDim;
        varying float vBright;

        void main() {
          vec4 tex = texture2D(uSprite, gl_PointCoord);
          if (tex.a < 0.02) discard;
          float a = tex.a * vBright * uOpacity * uGlobalAlpha * uExtraDim;
          // Brighter, more vivid mint — add a touch of white in the hot core
          vec3 hot = mix(uColor, vec3(1.0), pow(vBright, 4.0) * 0.65);
          gl_FragColor = vec4(hot * vBright * 2.2, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  // ── Build the world ───────────────────────────────────────────────────
  let grainMesh = null;
  function build() {
    // Clear existing
    for (const id in regionMeshes) {
      scene.remove(regionMeshes[id]);
      regionMeshes[id].geometry.dispose();
      regionMeshes[id].material.dispose();
      delete regionMeshes[id];
    }
    domainPositions.length = 0;
    window.ATLAS.REGIONS.forEach(buildRegion);
    buildDust();
  }
  build();

  // ── Grain overlay (screen-space) ──────────────────────────────────────
  let grainOn = true;
  function setGrain(on) {
    grainOn = on;
    if (!grainMesh) return;
    grainMesh.visible = on;
  }
  (function makeGrain() {
    // Use a fullscreen quad with a small noise texture for analog grain.
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 180 + Math.random() * 75;
      img.data[i] = v; img.data[i+1] = v; img.data[i+2] = v;
      img.data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearFilter;

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: tex },
        uTime: { value: 0 },
        uOpacity: { value: 0.06 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uTime;
        uniform float uOpacity;
        varying vec2 vUv;
        void main() {
          vec2 uv = vUv * 6.0 + vec2(uTime * 0.0007, uTime * 0.0005);
          float n = texture2D(uTex, uv).r;
          gl_FragColor = vec4(vec3(n), uOpacity * n);
        }
      `,
      transparent: true,
      depthTest: false, depthWrite: false,
    });
    grainMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    grainMesh.frustumCulled = false;
    grainMesh.renderOrder = 999;
    scene.add(grainMesh);
  })();

  // ── Camera poses ──────────────────────────────────────────────────────
  const POSES = {
    title: { pos: new THREE.Vector3(0, 0, 240), lookAt: new THREE.Vector3(0, 0, 0), fov: 36 },
    atlas: { pos: new THREE.Vector3(0, 0, 175), lookAt: new THREE.Vector3(0, 0, 0), fov: 40 },
    node:  { pos: null, lookAt: null, fov: 32 }, // set when concept view is built
  };

  let targetPose = POSES.atlas;
  let curPos = camera.position.clone();
  let curLook = new THREE.Vector3(0, 0, 0);
  let camMode = 'atlas';

  function setPose(name) {
    camMode = name;
    if (name === 'node') {
      const v = buildConceptView();
      POSES.node.pos = v.center.clone().add(new THREE.Vector3(0, 0, 36));
      POSES.node.lookAt = v.center.clone();
    } else {
      // dispose concept group
      if (conceptGroup) {
        scene.remove(conceptGroup);
        conceptGroup.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        conceptGroup = null;
        conceptFieldAnchors = [];
      }
    }
    targetPose = POSES[name];
  }

  // ── Drift toggle ──────────────────────────────────────────────────────
  function setDrift(on) {
    driftOn = on;
    const v = on ? 1.0 : 0.0;
    for (const id in regionMeshes) regionMeshes[id].material.uniforms.uDrift.value = v;
    if (dustMesh) dustMesh.material.uniforms.uDrift.value = v;
    if (conceptGroup) {
      conceptGroup.traverse((o) => {
        if (o.material && o.material.uniforms && o.material.uniforms.uDrift) {
          o.material.uniforms.uDrift.value = v;
        }
      });
    }
  }

  // ── Density change ────────────────────────────────────────────────────
  function setDensity(d) {
    densityScale = d;
    build();
    if (camMode === 'node') {
      // rebuild concept view too
      const v = buildConceptView();
      POSES.node.pos = v.center.clone().add(new THREE.Vector3(20, 4, 36));
      POSES.node.lookAt = v.center.clone();
    }
    setColor(currentColor);
    setDrift(driftOn);
    // notify controller so labels re-anchor
    if (window.CONTROLLER && window.CONTROLLER.refreshAnchors) {
      window.CONTROLLER.refreshAnchors();
    }
  }

  // ── Color change ──────────────────────────────────────────────────────
  let currentColor = '#5EEAB7';
  function setColor(hex) {
    currentColor = hex;
    mint.set(hex);
    document.documentElement.style.setProperty('--mint', hex);
    document.documentElement.style.setProperty(
      '--mint-dim',
      `rgba(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}, 0.45)`,
    );
    for (const id in regionMeshes) regionMeshes[id].material.uniforms.uColor.value.copy(mint);
    if (dustMesh) {
      dustMesh.material.uniforms.uColor.value.copy(mint).multiplyScalar(0.55);
    }
    if (conceptGroup) {
      conceptGroup.traverse((o) => {
        if (o.material && o.material.uniforms && o.material.uniforms.uColor) {
          o.material.uniforms.uColor.value.copy(mint);
        }
      });
    }
  }

  // ── Region focus / dimming ────────────────────────────────────────────
  // When a region is selected, dim the others.
  function focusRegion(id) {
    for (const rid in regionMeshes) {
      const dim = id && rid !== id ? 0.18 : 1.0;
      regionMeshes[rid].material.uniforms.uExtraDim.value = dim;
    }
  }

  // ── Raycaster picking (region clicks) ─────────────────────────────────
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points = { threshold: 5.5 };
  const mouse = new THREE.Vector2();

  function pickRegionAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const meshes = Object.values(regionMeshes);
    const hits = raycaster.intersectObjects(meshes, false);
    if (!hits.length) return null;
    // Choose the nearest hit's mesh
    return hits[0].object.userData.region;
  }

  // ── Render loop ───────────────────────────────────────────────────────
  let last = performance.now();
  let autoYaw = 0;
  let autoOrbit = true;

  function loop(now) {
    const dt = (now - last);
    last = now;

    // Auto-orbit yaw for the atlas view only (cinematic)
    if (autoOrbit && camMode !== 'node') autoYaw += dt * 0.000018;

    // Camera lerp — small factor = silky transitions
    const lerp = camMode === 'node' ? 0.022 : 0.018;
    if (targetPose && targetPose.pos) {
      // Apply yaw to atlas pose
      const tp = targetPose.pos.clone();
      if (camMode !== 'node') {
        const c = Math.cos(autoYaw), s = Math.sin(autoYaw);
        const x = tp.x, z = tp.z;
        tp.x = x * c + z * s;
        tp.z = -x * s + z * c;
      }
      curPos.lerp(tp, lerp);
      curLook.lerp(targetPose.lookAt, lerp);
      if (Math.abs(targetPose.fov - camera.fov) > 0.05) {
        camera.fov += (targetPose.fov - camera.fov) * lerp;
        camera.updateProjectionMatrix();
      }
      camera.position.copy(curPos);
      camera.lookAt(curLook);
    }

    // Update uniforms
    for (const id in regionMeshes) regionMeshes[id].material.uniforms.uTime.value = now;
    if (dustMesh) dustMesh.material.uniforms.uTime.value = now;
    if (conceptGroup) {
      conceptGroup.traverse((o) => {
        if (o.material && o.material.uniforms && o.material.uniforms.uTime) {
          o.material.uniforms.uTime.value = now;
        }
      });
    }
    if (grainMesh) grainMesh.material.uniforms.uTime.value = now;

    // Render
    renderer.render(scene, camera);

    // Update labels (controller adds them; we just project)
    window.LABELS.update(camera);

    // Update telemetry coords (cute)
    if (now - lastTelemetry > 100) {
      lastTelemetry = now;
      const ra = (autoYaw * 18) % 360;
      const dec = (Math.sin(now * 0.0001) * 22).toFixed(3);
      const tRa = document.getElementById('t-ra');
      const tDec = document.getElementById('t-dec');
      if (tRa) tRa.textContent = (ra >= 0 ? '+' : '') + ra.toFixed(3).padStart(7, '0');
      if (tDec) tDec.textContent = (parseFloat(dec) >= 0 ? '+' : '') + dec.padStart(7, '0');
    }

    requestAnimationFrame(loop);
  }
  let lastTelemetry = 0;
  requestAnimationFrame(loop);

  // ── Public API ────────────────────────────────────────────────────────
  return {
    camera,
    setPose,
    pickRegionAt,
    focusRegion,
    setColor,
    setDensity,
    setDrift,
    setGrain,
    regionAnchors,
    regionCenters,
    regionMeshes,
    domainPositions,
    getConceptFields: () => conceptFieldAnchors,
    getConceptCenter: () => POSES.node.lookAt ? POSES.node.lookAt.clone() : new THREE.Vector3(),
  };
})();
