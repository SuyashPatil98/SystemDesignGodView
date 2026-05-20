import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GNode, NodeKind } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  nodes: GNode[];            // ALL nodes in the dataset — capacity is fixed.
  visibleIds: Set<string>;   // The subset currently visible.
  layout: Map<string, Positioned>;
  selectedId: string | null;
  hoveredId: string | null;
  emphasized: Set<string> | null;
  conquered: Set<string>;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onShiftSelect?: (id: string) => void;
}

// Per-kind geometry — gives the eye an immediate read on *what kind* of node
// it is, and adds variety. Domains use PBR + env reflections so they look
// like polished gems. Other kinds stay emissive for bloom.
//
// Stability matters: we allocate every InstancedMesh once at the full
// per-kind capacity. Visibility is implemented as scale=0 in the loop so
// args never change and R3F never rebuilds the mesh — which is what was
// dropping clicks under the previous implementation.

const GOLD = new THREE.Color('#facc15');
const WHITE = new THREE.Color('#ffffff');
const HIDDEN_POS = new THREE.Vector3(0, -100000, 0);

// Build geometries once at module load.
const geomFor: Record<NodeKind, THREE.BufferGeometry> = {
  domain: new THREE.IcosahedronGeometry(1, 0),
  subdomain: new THREE.OctahedronGeometry(1, 0),
  concept: new THREE.SphereGeometry(1, 16, 16),
  pattern: new THREE.TorusGeometry(0.7, 0.28, 10, 20),
  tool: new THREE.BoxGeometry(1.25, 1.25, 1.25),
  metric: new THREE.TetrahedronGeometry(1.15, 0),
  failureMode: new THREE.IcosahedronGeometry(1.05, 1),
};

const geomHalo = new THREE.SphereGeometry(1, 12, 12);
const geomCrown = new THREE.TorusGeometry(1.2, 0.12, 10, 32);

const KINDS: NodeKind[] = [
  'domain',
  'subdomain',
  'concept',
  'pattern',
  'tool',
  'metric',
  'failureMode',
];

function makeMaterialFor(kind: NodeKind): THREE.Material {
  if (kind === 'domain') {
    return new THREE.MeshPhysicalMaterial({
      metalness: 0.35,
      roughness: 0.22,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.55,
      emissive: new THREE.Color('#000000'),
      emissiveIntensity: 0.4,
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
  return new THREE.MeshBasicMaterial({ toneMapped: false });
}

interface KindBucket {
  kind: NodeKind;
  nodes: GNode[];
  ids: string[];
}

export default function NodeMesh({
  nodes,
  visibleIds,
  layout,
  selectedId,
  hoveredId,
  emphasized,
  conquered,
  onHover,
  onSelect,
  onShiftSelect,
}: Props) {
  // Refs to each kind's InstancedMesh. Stable across re-renders.
  const domainRef = useRef<THREE.InstancedMesh>(null);
  const subdomainRef = useRef<THREE.InstancedMesh>(null);
  const conceptRef = useRef<THREE.InstancedMesh>(null);
  const patternRef = useRef<THREE.InstancedMesh>(null);
  const toolRef = useRef<THREE.InstancedMesh>(null);
  const metricRef = useRef<THREE.InstancedMesh>(null);
  const failureModeRef = useRef<THREE.InstancedMesh>(null);
  const refsByKind: Record<NodeKind, React.RefObject<THREE.InstancedMesh>> = useMemo(
    () => ({
      domain: domainRef,
      subdomain: subdomainRef,
      concept: conceptRef,
      pattern: patternRef,
      tool: toolRef,
      metric: metricRef,
      failureMode: failureModeRef,
    }),
    [],
  );
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  // Buckets built ONCE from the full dataset. Capacity is fixed at mount.
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

  // Halo + crown are indexed by all-nodes-in-order so the index space is stable.
  const allIdsInOrder = useMemo(() => nodes.map((n) => n.id), [nodes]);

  // Pre-compute base size/color per node.
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

  // Materials memoized once (per kind). NEVER recreated.
  const materials = useMemo(() => {
    const m: Record<NodeKind, THREE.Material> = {} as any;
    for (const k of KINDS) m[k] = makeMaterialFor(k);
    return m;
  }, []);

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

    // ─── Per-kind nodes ───
    for (const bucket of buckets) {
      const mesh = refsByKind[bucket.kind].current;
      if (!mesh) continue;

      for (let i = 0; i < bucket.nodes.length; i++) {
        const n = bucket.nodes[i];
        const visible = visibleIds.has(n.id);
        const pos = layout.get(n.id);
        if (!visible || !pos) {
          // Hide: zero scale + move far below so raycast can't hit it.
          dummy.position.copy(HIDDEN_POS);
          dummy.scale.setScalar(0.0001);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          mesh.setColorAt(i, tmpColor.set(0, 0, 0));
          continue;
        }

        const isSel = n.id === selectedId;
        const isHover = n.id === hoveredId;
        const isConq = conquered.has(n.id);
        const dim = emphasized && !emphasized.has(n.id);

        let scale = sizeById.get(n.id) ?? 0.5;
        if (isHover) scale *= 1.4;
        if (isSel) scale *= 1.6;

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

        const color = (colorById.get(n.id) ?? WHITE).clone();
        if (dim) color.multiplyScalar(0.22);
        if (isConq) color.lerp(GOLD, 0.18);
        if (isSel) color.lerp(WHITE, 0.32);
        else if (isHover) color.lerp(WHITE, 0.2);
        if (bucket.kind === 'domain' || bucket.kind === 'subdomain') {
          color.multiplyScalar(1.45);
        }
        mesh.setColorAt(i, color);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // ─── Halo + crown (indexed by allIdsInOrder) ───
    for (let i = 0; i < allIdsInOrder.length; i++) {
      const id = allIdsInOrder[i];
      const visible = visibleIds.has(id);
      const pos = layout.get(id);

      if (!visible || !pos) {
        dummy.position.copy(HIDDEN_POS);
        dummy.scale.setScalar(0.0001);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        halo.setMatrixAt(i, dummy.matrix);
        crown.setMatrixAt(i, dummy.matrix);
        halo.setColorAt(i, tmpColor.set(0, 0, 0));
        crown.setColorAt(i, tmpColor.set(0, 0, 0));
        continue;
      }

      const isSel = id === selectedId;
      const isHover = id === hoveredId;
      const isConq = conquered.has(id);
      const dim = emphasized && !emphasized.has(id);

      let scale = sizeById.get(id) ?? 0.5;
      if (isHover) scale *= 1.4;
      if (isSel) scale *= 1.6;

      dummy.position.copy(pos.position);
      dummy.rotation.set(0, 0, 0);
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

      {buckets.map((bucket) => {
        if (bucket.nodes.length === 0) return null;
        return (
          <instancedMesh
            key={bucket.kind}
            ref={refsByKind[bucket.kind]}
            args={[geomFor[bucket.kind], materials[bucket.kind], bucket.nodes.length]}
            frustumCulled={false}
            onPointerOver={(e) => {
              e.stopPropagation();
              const i = e.instanceId;
              if (typeof i !== 'number') return;
              const id = bucket.ids[i];
              if (visibleIds.has(id)) {
                onHover(id);
                document.body.style.cursor = 'pointer';
              }
            }}
            onPointerOut={() => {
              onHover(null);
              document.body.style.cursor = '';
            }}
            onClick={(e) => {
              e.stopPropagation();
              const i = e.instanceId;
              if (typeof i !== 'number') return;
              const id = bucket.ids[i];
              if (!visibleIds.has(id)) return;
              if (e.nativeEvent.shiftKey && onShiftSelect) {
                onShiftSelect(id);
              } else {
                onSelect(id);
              }
            }}
          />
        );
      })}
    </>
  );
}
