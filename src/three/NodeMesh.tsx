import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GNode, NodeKind } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  nodes: GNode[];
  layout: Map<string, Positioned>;
  selectedId: string | null;
  hoveredId: string | null;
  emphasized: Set<string> | null;
  conquered: Set<string>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

// Per-kind geometry — gives the eye an immediate read on *what kind* of node
// it's looking at, and adds visual variety. Domains use PBR + env reflections
// so they look like polished gems; everything else stays emissive for bloom.

const GOLD = new THREE.Color('#facc15');
const WHITE = new THREE.Color('#ffffff');

// Build geometries once.
const geomFor: Record<NodeKind, THREE.BufferGeometry> = {
  domain: new THREE.IcosahedronGeometry(1, 0),       // crystal / gem
  subdomain: new THREE.OctahedronGeometry(1, 0),     // simpler crystal
  concept: new THREE.SphereGeometry(1, 16, 16),      // smooth sphere
  pattern: new THREE.TorusGeometry(0.7, 0.28, 10, 20), // ring (architecture pattern)
  tool: new THREE.BoxGeometry(1.25, 1.25, 1.25),     // cube
  metric: new THREE.TetrahedronGeometry(1.15, 0),    // pyramid
  failureMode: new THREE.IcosahedronGeometry(1.05, 1), // jagged sphere
};

// Halo + crown geometries — shared.
const geomHalo = new THREE.SphereGeometry(1, 12, 12);
const geomCrown = new THREE.TorusGeometry(1.2, 0.12, 10, 32);

// Kind groups we render — drives our per-kind InstancedMesh layout.
const KINDS: NodeKind[] = [
  'domain',
  'subdomain',
  'concept',
  'pattern',
  'tool',
  'metric',
  'failureMode',
];

// Per-kind material factory.
function makeMaterialFor(kind: NodeKind): THREE.Material {
  if (kind === 'domain') {
    // PBR — picks up env reflections from the procedural cubemap.
    return new THREE.MeshPhysicalMaterial({
      metalness: 0.35,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.55,
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.4,
      transparent: false,
      toneMapped: true,
    });
  }
  if (kind === 'subdomain') {
    return new THREE.MeshStandardMaterial({
      metalness: 0.25,
      roughness: 0.45,
      envMapIntensity: 0.9,
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.6,
      toneMapped: true,
    });
  }
  // Concept / pattern / tool / metric / failureMode — fully emissive so bloom
  // catches them. No env map.
  return new THREE.MeshBasicMaterial({
    toneMapped: false,
  });
}

interface KindBucket {
  kind: NodeKind;
  nodes: GNode[];
  ids: string[];
}

export default function NodeMesh({
  nodes,
  layout,
  selectedId,
  hoveredId,
  emphasized,
  conquered,
  onHover,
  onSelect,
}: Props) {
  const meshRefs = useRef<Record<NodeKind, THREE.InstancedMesh | null>>({
    domain: null,
    subdomain: null,
    concept: null,
    pattern: null,
    tool: null,
    metric: null,
    failureMode: null,
  });
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  const buckets: KindBucket[] = useMemo(() => {
    const out: KindBucket[] = KINDS.map((kind) => ({
      kind,
      nodes: [],
      ids: [],
    }));
    const byKind = new Map<NodeKind, KindBucket>(out.map((b) => [b.kind, b]));
    for (const n of nodes) {
      const b = byKind.get(n.kind);
      if (!b) continue;
      b.nodes.push(n);
      b.ids.push(n.id);
    }
    return out;
  }, [nodes]);

  const allIdsInHaloOrder = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const sizeById = useMemo(() => {
    const m = new Map<string, number>();
    nodes.forEach((n) => m.set(n.id, layout.get(n.id)?.size ?? 0.5));
    return m;
  }, [nodes, layout]);

  const colorById = useMemo(() => {
    const m = new Map<string, THREE.Color>();
    nodes.forEach((n) =>
      m.set(
        n.id,
        layout.get(n.id)?.color.clone() ?? new THREE.Color('#94a3b8'),
      ),
    );
    return m;
  }, [nodes, layout]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpUp = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    const halo = haloRef.current;
    const crown = crownRef.current;
    if (!halo || !crown) return;

    // Per-kind matrices/colors.
    for (const bucket of buckets) {
      const mesh = meshRefs.current[bucket.kind];
      if (!mesh) continue;

      for (let i = 0; i < bucket.nodes.length; i++) {
        const n = bucket.nodes[i];
        const pos = layout.get(n.id);
        if (!pos) continue;
        const isSel = n.id === selectedId;
        const isHover = n.id === hoveredId;
        const isConq = conquered.has(n.id);
        const dim = emphasized && !emphasized.has(n.id);

        let scale = sizeById.get(n.id) ?? 0.5;
        if (isHover) scale *= 1.4;
        if (isSel) scale *= 1.6;

        // Continuous gentle spin for non-spherical shapes.
        const spinPhase = i * 0.31;
        const spinRate =
          bucket.kind === 'concept'
            ? 0
            : bucket.kind === 'domain'
            ? 0.12
            : 0.28;

        const breathe = isSel
          ? 1 + Math.sin(t.current * 3.0) * 0.07
          : isHover
          ? 1 + Math.sin(t.current * 4.0) * 0.04
          : 1;

        dummy.position.copy(pos.position);
        dummy.scale.setScalar(scale * breathe);
        dummy.rotation.set(
          t.current * spinRate * 0.6 + spinPhase,
          t.current * spinRate + spinPhase * 1.7,
          0,
        );
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const baseColor = (colorById.get(n.id) ?? WHITE).clone();
        // Domains use PBR — we set emissive via instanceColor (the material's
        // .color is multiplied into both diffuse and emissive when emissiveIntensity > 0).
        const color = baseColor.clone();
        if (dim) color.multiplyScalar(0.22);
        if (isConq) color.lerp(GOLD, 0.18);
        if (isSel) color.lerp(WHITE, 0.32);
        else if (isHover) color.lerp(WHITE, 0.2);

        // Boost the emissive contribution of PBR meshes by pre-multiplying the
        // instance colour — they read as bright but still take env reflections.
        if (bucket.kind === 'domain' || bucket.kind === 'subdomain') {
          color.multiplyScalar(1.45);
        }
        mesh.setColorAt(i, color);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // Halo + crown (one entry per node, indexed by all-nodes-in-order).
    for (let i = 0; i < allIdsInHaloOrder.length; i++) {
      const id = allIdsInHaloOrder[i];
      const pos = layout.get(id);
      if (!pos) continue;
      const isSel = id === selectedId;
      const isHover = id === hoveredId;
      const isConq = conquered.has(id);
      const dim = emphasized && !emphasized.has(id);

      let scale = sizeById.get(id) ?? 0.5;
      if (isHover) scale *= 1.4;
      if (isSel) scale *= 1.6;

      dummy.position.copy(pos.position);
      dummy.rotation.set(0, 0, 0);

      // Halo.
      dummy.scale.setScalar(
        scale * (isSel ? 3.6 : isHover ? 2.8 : isConq ? 2.4 : 2.2),
      );
      dummy.updateMatrix();
      halo.setMatrixAt(i, dummy.matrix);
      const haloColor = (colorById.get(id) ?? WHITE).clone();
      if (dim) haloColor.multiplyScalar(0.05);
      else if (isConq) haloColor.multiplyScalar(0.6);
      else haloColor.multiplyScalar(0.45);
      halo.setColorAt(i, haloColor);

      // Crown (only conquered).
      if (isConq) {
        const crownPulse = 1 + Math.sin(t.current * 2.2 + i * 0.7) * 0.06;
        tmpQuat.setFromUnitVectors(tmpUp, pos.position.clone().normalize());
        dummy.scale.setScalar(scale * 1.5 * crownPulse);
        dummy.quaternion.copy(tmpQuat);
        dummy.updateMatrix();
        crown.setMatrixAt(i, dummy.matrix);
        tmpColor.copy(GOLD).multiplyScalar(dim ? 0.2 : 1.0);
        crown.setColorAt(i, tmpColor);
      } else {
        dummy.scale.setScalar(0.0001);
        dummy.quaternion.identity();
        dummy.updateMatrix();
        crown.setMatrixAt(i, dummy.matrix);
        crown.setColorAt(i, tmpColor.set(0, 0, 0));
      }
    }

    halo.instanceMatrix.needsUpdate = true;
    crown.instanceMatrix.needsUpdate = true;
    if (halo.instanceColor) halo.instanceColor.needsUpdate = true;
    if (crown.instanceColor) crown.instanceColor.needsUpdate = true;
  });

  return (
    <>
      {/* Halo behind everything */}
      <instancedMesh
        ref={haloRef}
        args={[geomHalo, undefined as any, Math.max(1, nodes.length)]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          transparent
          opacity={0.32}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Crown for conquered nodes */}
      <instancedMesh
        ref={crownRef}
        args={[geomCrown, undefined as any, Math.max(1, nodes.length)]}
        frustumCulled={false}
      >
        <meshBasicMaterial
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>

      {/* One instanced mesh per kind */}
      {buckets.map((bucket) => {
        if (bucket.nodes.length === 0) return null;
        const material = makeMaterialFor(bucket.kind);
        return (
          <instancedMesh
            key={bucket.kind}
            ref={(m) => {
              meshRefs.current[bucket.kind] = m;
            }}
            args={[geomFor[bucket.kind], material, bucket.nodes.length]}
            frustumCulled={false}
            onPointerOver={(e) => {
              e.stopPropagation();
              const i = e.instanceId;
              if (typeof i === 'number') onHover(bucket.ids[i]);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              onHover(null);
              document.body.style.cursor = '';
            }}
            onClick={(e) => {
              e.stopPropagation();
              const i = e.instanceId;
              if (typeof i === 'number') onSelect(bucket.ids[i]);
            }}
          />
        );
      })}
    </>
  );
}
