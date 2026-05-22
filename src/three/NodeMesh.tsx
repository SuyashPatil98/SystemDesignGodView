import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode } from '../data/schema';
import type { Positioned } from './layout';
import { electricColorForDomain } from './layout';

interface Props {
  nodes: GNode[]; // ALL nodes in the dataset — capacity is fixed.
  visibleIds: Set<string>; // The subset currently visible.
  layout: Map<string, Positioned>;
  selectedId: string | null;
  hoveredId: string | null;
  emphasized: Set<string> | null;
  conquered: Set<string>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onShiftSelect?: (id: string) => void;
}

// ───────────────────── Surface .05 — particle scene ─────────────────────
//
// Each domain becomes a swarm of ~440+ point sprites in 3 layers (core, mid,
// halo) plus small anchor clusters at every subdomain and concept position.
// The visual is shader-driven (gentle drift, sprite-textured points with
// additive blending). uColor reads from the palette store so MINT/IRIS
// toggling retints every particle live.
//
// Selection / hover / clicking still works because we render an invisible
// InstancedMesh of small spheres at every node's exact layout position —
// raycasts hit those, particle clouds skip raycasting entirely.

const HIDDEN_POS = new THREE.Vector3(0, -100000, 0);

// ── Sprite (shared) ─────────────────────────────────────────────────────
function makeSprite(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.18, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.25)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.minFilter = THREE.LinearFilter;
  return t;
}

// ── Box-Muller gaussian in 3D ───────────────────────────────────────────
function gaussian3(scale: number): THREE.Vector3 {
  const bm = () => {
    const u = Math.random() || 1e-9;
    const v = Math.random() || 1e-9;
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return new THREE.Vector3(bm() * scale, bm() * scale, bm() * scale);
}

const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aBright;
  attribute float aSeed;
  attribute vec3  aColor;
  uniform float uTime;
  uniform float uPixel;
  uniform float uDrift;
  uniform float uSizeMul;
  varying float vBright;
  varying vec3  vColor;

  void main() {
    vBright = aBright;
    vColor  = aColor;
    vec3 p = position;
    float t = uTime * 0.00035;
    p.x += sin(t + aSeed) * 0.55 * uDrift;
    p.y += cos(t * 0.78 + aSeed * 1.7) * 0.42 * uDrift;
    p.z += sin(t * 0.61 + aSeed * 2.3) * 0.48 * uDrift;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uSizeMul * uPixel * (260.0 / -mv.z);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  uniform sampler2D uSprite;
  uniform float uOpacity;
  uniform float uGlobalAlpha;
  varying float vBright;
  varying vec3  vColor;

  void main() {
    vec4 tex = texture2D(uSprite, gl_PointCoord);
    if (tex.a < 0.04) discard;
    // pow(...,1.6) crushes the gradient so the disc has a tight hot
    // core and a sharper drop-off — pips read as defined points
    // instead of soft fuzz that bloom turns into chromatic squares.
    float aShape = pow(tex.a, 1.6);
    float a = aShape * vBright * uOpacity * uGlobalAlpha;
    // Per-vertex colour (set per-cloud uniformly OR per-pip individually),
    // then hot-shifted toward white for the brightest core fragments so
    // dense regions still bloom hot without losing their family hue.
    vec3 hot = mix(vColor, vec3(1.0), pow(vBright, 4.0) * 0.55);
    gl_FragColor = vec4(hot * vBright * 1.25, a);
  }
`;

function makeMaterial(
  sprite: THREE.Texture,
  pixelRatio: number,
  opts: { sizeMul?: number; opacity?: number } = {},
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSprite: { value: sprite },
      uPixel: { value: pixelRatio },
      uDrift: { value: 1.0 },
      uOpacity: { value: opts.opacity ?? 1.0 },
      uSizeMul: { value: opts.sizeMul ?? 1.0 },
      uGlobalAlpha: { value: 1.0 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ── Per-domain cloud geometry ───────────────────────────────────────────
function buildDomainCloud(
  domain: GNode,
  _allNodes: GNode[],
  layout: Map<string, Positioned>,
  childrenByParent: Map<string, GNode[]>,
  color: THREE.Color,
): THREE.BufferGeometry {
  const center = layout.get(domain.id)?.position;
  const geo = new THREE.BufferGeometry();
  if (!center) return geo;

  const positions: number[] = [];
  const sizes: number[] = [];
  const brightness: number[] = [];
  const seeds: number[] = [];

  const push = (p: THREE.Vector3, s: number, b: number) => {
    positions.push(p.x, p.y, p.z);
    sizes.push(s);
    brightness.push(b);
    seeds.push(Math.random() * 6.28);
  };

  // Core — tight, bright
  for (let i = 0; i < 40; i++) {
    push(
      gaussian3(2.0).add(center),
      1.6 + Math.random() * 0.8,
      0.9 + Math.random() * 0.1,
    );
  }
  // Mid — spread
  for (let i = 0; i < 130; i++) {
    push(
      gaussian3(6.0).add(center),
      0.9 + Math.random() * 0.7,
      0.55 + Math.random() * 0.3,
    );
  }
  // Halo — sparse atmosphere
  for (let i = 0; i < 260; i++) {
    push(
      gaussian3(12).add(center),
      0.5 + Math.random() * 0.6,
      0.18 + Math.random() * 0.22,
    );
  }

  // Per subdomain anchor — gives the subdomain a hot spot in the cloud
  const subs = childrenByParent.get(domain.id) ?? [];
  for (const s of subs) {
    const sp = layout.get(s.id)?.position;
    if (!sp) continue;
    for (let i = 0; i < 5; i++) {
      push(
        gaussian3(1.5).add(sp),
        1.0 + Math.random() * 0.6,
        0.7 + Math.random() * 0.15,
      );
    }
    // Per concept under this subdomain
    const concepts = childrenByParent.get(s.id) ?? [];
    for (const c of concepts) {
      const cp = layout.get(c.id)?.position;
      if (!cp) continue;
      for (let i = 0; i < 3; i++) {
        push(
          gaussian3(0.8).add(cp),
          0.7 + Math.random() * 0.3,
          0.45 + Math.random() * 0.15,
        );
      }
    }
  }

  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geo.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geo.setAttribute(
    'aBright',
    new THREE.Float32BufferAttribute(brightness, 1),
  );
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));

  // Per-vertex colour — every vertex in this cloud gets the same domain
  // hue; the fragment shader hot-shifts the brightest fragments toward
  // white so dense regions still read but the family colour persists.
  const colors = new Float32Array(positions.length);
  for (let i = 0; i < positions.length / 3; i++) {
    colors[i * 3 + 0] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  return geo;
}

// ──────────────────────── component ─────────────────────────────────────
export default function NodeMesh({
  nodes,
  visibleIds,
  layout,
  selectedId,
  hoveredId,
  emphasized,
  onHover,
  onSelect,
  onShiftSelect,
}: Props) {
  const palette = useGraphStore((s) => s.palette);
  const { gl } = useThree();

  // Sprite + pixel ratio — created once.
  const sprite = useMemo(() => makeSprite(), []);
  const pixelRatio = useMemo(() => gl.getPixelRatio(), [gl]);

  // Pre-compute children map so we don't rebuild it per domain.
  const childrenByParent = useMemo(() => {
    const m = new Map<string, GNode[]>();
    for (const n of nodes) {
      if (!n.parentId) continue;
      const arr = m.get(n.parentId) ?? [];
      arr.push(n);
      m.set(n.parentId, arr);
    }
    return m;
  }, [nodes]);

  // Domains and their geometries (one cloud per domain).
  const domainNodes = useMemo(
    () => nodes.filter((n) => n.kind === 'domain'),
    [nodes],
  );

  const cloudGeometries = useMemo(
    () =>
      domainNodes.map((d) =>
        buildDomainCloud(
          d,
          nodes,
          layout,
          childrenByParent,
          electricColorForDomain(d.id),
        ),
      ),
    [domainNodes, nodes, layout, childrenByParent],
  );

  const cloudMaterials = useMemo(
    () => domainNodes.map(() => makeMaterial(sprite, pixelRatio)),
    [domainNodes, sprite, pixelRatio],
  );

  // ── Node pips — one bright sprite at every non-domain node's exact
  //    position so subdomains / concepts / patterns etc. are findable
  //    inside the cluster swarm.
  const pipNodes = useMemo(
    () => nodes.filter((n) => n.kind !== 'domain'),
    [nodes],
  );
  // Base (target) size per node kind. Pip size lerps toward this target
  // whenever the node becomes visible; lerps to 0 when hidden. Settled at
  // 5.0 / 3.6 / 2.8 — the prior 7.5/5.0/3.6 push combined with the 2.2×
  // shader boost rendered subdomain pips as fuzzy chromatic squares once
  // bloom got hold of them. With the sharper falloff in the fragment
  // shader these sizes still read as defined points.
  const pipBaseSize = (kind: GNode['kind']) =>
    kind === 'subdomain' ? 5.0 : kind === 'concept' ? 3.6 : 2.8;

  const pipGeometry = useMemo(() => {
    const positions = new Float32Array(pipNodes.length * 3);
    const sizes = new Float32Array(pipNodes.length); // current (lerped) size
    const brights = new Float32Array(pipNodes.length);
    const seeds = new Float32Array(pipNodes.length);
    // Per-pip colour, derived from its domain. Cached so we don't construct
    // a Color per node.
    const colors = new Float32Array(pipNodes.length * 3);
    const colorCache = new Map<string, THREE.Color>();
    for (let i = 0; i < pipNodes.length; i++) {
      const n = pipNodes[i];
      const p = layout.get(n.id)?.position;
      positions[i * 3 + 0] = p?.x ?? 0;
      positions[i * 3 + 1] = p?.y ?? 0;
      positions[i * 3 + 2] = p?.z ?? 0;
      // Start size 0 — they grow in on first visibility.
      sizes[i] = 0;
      brights[i] = n.kind === 'subdomain' ? 0.98 : 0.82;
      seeds[i] = Math.random() * 6.28;
      // Pips are extra-bright (sat 0.95, lightness 0.66) so they punch
      // through the cloud they sit inside.
      let c = colorCache.get(n.domainId);
      if (!c) {
        c = electricColorForDomain(n.domainId, 0.95, 0.66);
        colorCache.set(n.domainId, c);
      }
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aBright', new THREE.BufferAttribute(brights, 1));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [pipNodes, layout]);
  const pipMaterial = useMemo(
    () => makeMaterial(sprite, pixelRatio, { sizeMul: 1.0 }),
    [sprite, pixelRatio],
  );
  // Track previous visibility/size state so we only push attribute updates
  // on change rather than every frame.
  const pipLastDirtyRef = useRef(0);

  // Galaxy colours are now per-cluster (electric per-domain hue), not
  // single-accent. The palette toggle still controls UI chrome via the
  // CSS vars; the scene reads them at construction time only.
  void palette;

  // Cleanup geometries + materials on unmount or when they change.
  useEffect(() => {
    return () => {
      for (const g of cloudGeometries) g.dispose();
      for (const m of cloudMaterials) m.dispose();
    };
  }, [cloudGeometries, cloudMaterials]);
  useEffect(
    () => () => {
      pipGeometry.dispose();
      pipMaterial.dispose();
      sprite.dispose();
    },
    [pipGeometry, pipMaterial, sprite],
  );

  // Which domains should be "lit" right now? Derived from `emphasized`.
  const emphasizedDomainIds = useMemo(() => {
    if (!emphasized) return null;
    const out = new Set<string>();
    for (const n of nodes) {
      if (emphasized.has(n.id)) out.add(n.domainId);
    }
    return out;
  }, [nodes, emphasized]);

  // ── Click targets — invisible spheres at every node's position ──────
  const clickRef = useRef<THREE.InstancedMesh>(null);
  const idsInOrder = useMemo(() => nodes.map((n) => n.id), [nodes]);
  const sizeById = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) m.set(n.id, layout.get(n.id)?.size ?? 0.5);
    return m;
  }, [nodes, layout]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const clickGeom = useMemo(() => new THREE.SphereGeometry(1, 8, 8), []);

  // ── Per-frame: time, drift, emphasis fade, click+marker updates ─────
  useFrame((state) => {
    const elapsedMs = state.clock.elapsedTime * 1000;

    // Cloud uTime + per-domain emphasis fade.
    // - emphasized OR selected-domain → lit (1.0); selected gets an extra
    //   brightness boost so clicking a domain is unmistakably "this one".
    // - all others → dim 0.15 when an emphasized set is active.
    const selectedDomainId =
      selectedId
        ? (() => {
            // Walk up to find the domain id (only if it's reachable).
            for (const n of nodes) {
              if (n.id === selectedId) return n.kind === 'domain' ? n.id : n.domainId;
            }
            return null;
          })()
        : null;
    for (let i = 0; i < cloudMaterials.length; i++) {
      const m = cloudMaterials[i];
      m.uniforms.uTime.value = elapsedMs;
      const did = domainNodes[i].id;
      const isLit =
        !emphasizedDomainIds || emphasizedDomainIds.has(did);
      const isSelectedDomain = did === selectedDomainId;
      const target = isSelectedDomain ? 1.35 : isLit ? 1.0 : 0.15;
      const cur = m.uniforms.uGlobalAlpha.value as number;
      m.uniforms.uGlobalAlpha.value = cur + (target - cur) * 0.08;
    }

    // Pip uTime + per-frame smooth size lerp toward each node's target.
    // Newly-visible nodes grow in from 0 → target with a slight overshoot
    // so the user gets an unmistakable "yes, this just expanded" pop.
    pipMaterial.uniforms.uTime.value = elapsedMs;
    const pipSizeAttr = pipGeometry.attributes.aSize as THREE.BufferAttribute;
    const pipBrightAttr = pipGeometry.attributes.aBright as THREE.BufferAttribute;
    const sizes = pipSizeAttr.array as Float32Array;
    const brights = pipBrightAttr.array as Float32Array;
    let pipDirty = false;
    for (let i = 0; i < pipNodes.length; i++) {
      const n = pipNodes[i];
      const isVisible = visibleIds.has(n.id);
      const isSel = n.id === selectedId;
      const isHover = n.id === hoveredId;
      const base = pipBaseSize(n.kind);
      const target = !isVisible
        ? 0
        : base * (isSel ? 1.55 : isHover ? 1.25 : 1);
      const cur = sizes[i];
      // Slightly snappier when growing than shrinking; visible appear feels
      // immediate, hide is calm.
      const growing = target > cur;
      const k = growing ? 0.22 : 0.14;
      const next = cur + (target - cur) * k;
      // Snap when very close to target so we stop touching the buffer.
      const final = Math.abs(next - target) < 0.01 ? target : next;
      if (sizes[i] !== final) {
        sizes[i] = final;
        pipDirty = true;
      }

      const baseBright = n.kind === 'subdomain' ? 0.98 : 0.82;
      const wantBright = !isVisible ? 0 : isSel || isHover ? 1.0 : baseBright;
      const curBright = brights[i];
      const nextBright = curBright + (wantBright - curBright) * 0.18;
      const finalBright =
        Math.abs(nextBright - wantBright) < 0.01 ? wantBright : nextBright;
      if (brights[i] !== finalBright) {
        brights[i] = finalBright;
        pipDirty = true;
      }
    }
    if (pipDirty) {
      pipSizeAttr.needsUpdate = true;
      pipBrightAttr.needsUpdate = true;
      pipLastDirtyRef.current = elapsedMs;
    }

    // Click target positions — invisible spheres at every node.
    const click = clickRef.current;
    if (click) {
      for (let i = 0; i < idsInOrder.length; i++) {
        const id = idsInOrder[i];
        const pos = layout.get(id)?.position;
        if (!visibleIds.has(id) || !pos) {
          dummy.position.copy(HIDDEN_POS);
          dummy.scale.setScalar(0.0001);
        } else {
          dummy.position.copy(pos);
          // Generous click target — ~2× the node's visual size so the user
          // doesn't have to be pixel-perfect when clicking through cloud haze.
          // Also enforce a floor so even tiny detail nodes are reachable.
          const s = Math.max(2.5, (sizeById.get(id) ?? 0.5) * 2.0);
          dummy.scale.setScalar(s);
        }
        dummy.updateMatrix();
        click.setMatrixAt(i, dummy.matrix);
      }
      click.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Particle clouds — one per domain, decorative only */}
      {domainNodes.map((d, i) => (
        <points
          key={d.id}
          geometry={cloudGeometries[i]}
          material={cloudMaterials[i]}
          frustumCulled={false}
          raycast={() => null}
        />
      ))}

      {/* Per-node pips — bright sprites at every non-domain node */}
      <points
        geometry={pipGeometry}
        material={pipMaterial}
        frustumCulled={false}
        raycast={() => null}
      />

      {/* Invisible click targets — one InstancedMesh for everything */}
      <instancedMesh
        ref={clickRef}
        args={[clickGeom, undefined as any, Math.max(1, nodes.length)]}
        frustumCulled={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          const i = e.instanceId;
          if (typeof i !== 'number') return;
          const id = idsInOrder[i];
          if (!visibleIds.has(id)) return;
          onHover(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          const i = e.instanceId;
          if (typeof i !== 'number') return;
          const id = idsInOrder[i];
          if (!visibleIds.has(id)) return;
          const ne = e.nativeEvent;
          const shiftOnly =
            ne.shiftKey && !ne.altKey && !ne.ctrlKey && !ne.metaKey;
          if (shiftOnly && onShiftSelect) onShiftSelect(id);
          else onSelect(id);
        }}
      >
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
