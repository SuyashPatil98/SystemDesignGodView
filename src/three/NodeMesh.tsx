import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GNode } from '../data/schema';
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

// Three instanced layers per scene:
//   1) Core sphere — the node body, fully emissive, vertex-colored.
//   2) Halo — soft glow blended additively.
//   3) Crown — a ring (torus) shown only on conquered nodes (gold).

const GOLD = new THREE.Color('#facc15');
const WHITE = new THREE.Color('#ffffff');

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
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const haloRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  const idsInOrder = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const sizeById = useMemo(() => {
    const m = new Map<string, number>();
    nodes.forEach((n) => m.set(n.id, layout.get(n.id)?.size ?? 0.5));
    return m;
  }, [nodes, layout]);

  const colorById = useMemo(() => {
    const m = new Map<string, THREE.Color>();
    nodes.forEach((n) =>
      m.set(n.id, layout.get(n.id)?.color.clone() ?? new THREE.Color('#94a3b8')),
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
    const mesh = meshRef.current;
    const halo = haloRef.current;
    const crown = crownRef.current;
    if (!mesh || !halo || !crown) return;

    for (let i = 0; i < idsInOrder.length; i++) {
      const id = idsInOrder[i];
      const pos = layout.get(id);
      if (!pos) continue;
      const isSel = id === selectedId;
      const isHover = id === hoveredId;
      const isConq = conquered.has(id);
      const dim = emphasized && !emphasized.has(id);

      let scale = sizeById.get(id) ?? 0.5;
      if (isHover) scale *= 1.45;
      if (isSel) scale *= 1.65;

      const breathe = isSel
        ? 1 + Math.sin(t.current * 3.0) * 0.07
        : isHover
        ? 1 + Math.sin(t.current * 4.0) * 0.04
        : 1;

      // Core node.
      dummy.position.copy(pos.position);
      dummy.scale.setScalar(scale * breathe);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const color = (colorById.get(id) ?? WHITE).clone();
      if (dim) color.multiplyScalar(0.22);
      if (isConq) color.lerp(GOLD, 0.18); // subtle gold tinge to conquered cores
      if (isSel) color.lerp(WHITE, 0.35);
      else if (isHover) color.lerp(WHITE, 0.2);
      mesh.setColorAt(i, color);

      // Halo — bigger, dimmer, additive.
      dummy.scale.setScalar(
        scale * (isSel ? 3.6 : isHover ? 2.8 : isConq ? 2.4 : 2.2),
      );
      dummy.updateMatrix();
      halo.setMatrixAt(i, dummy.matrix);
      tmpColor.copy(color);
      tmpColor.multiplyScalar(dim ? 0.05 : isConq ? 0.55 : 0.42);
      halo.setColorAt(i, tmpColor);

      // Crown (torus) — only conquered, billboarded toward +Y.
      if (isConq) {
        const crownPulse = 1 + Math.sin(t.current * 2.2 + i * 0.7) * 0.06;
        const crownScale = scale * 1.5 * crownPulse;
        // Orient torus to face the camera-ish: keep its Y axis aligned to world up
        // and tilt slightly outward. Cheap approximation that still reads well.
        const out = pos.position.clone().normalize();
        tmpQuat.setFromUnitVectors(tmpUp, out);
        dummy.position.copy(pos.position);
        dummy.scale.setScalar(crownScale);
        dummy.quaternion.copy(tmpQuat);
        dummy.updateMatrix();
        crown.setMatrixAt(i, dummy.matrix);
        const crownCol = GOLD.clone().multiplyScalar(dim ? 0.2 : 1.0);
        crown.setColorAt(i, crownCol);
      } else {
        // Hide crown by collapsing its matrix to zero scale.
        dummy.position.copy(pos.position);
        dummy.scale.setScalar(0.0001);
        dummy.quaternion.identity();
        dummy.updateMatrix();
        crown.setMatrixAt(i, dummy.matrix);
        crown.setColorAt(i, tmpColor.set(0, 0, 0));
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    halo.instanceMatrix.needsUpdate = true;
    crown.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (halo.instanceColor) halo.instanceColor.needsUpdate = true;
    if (crown.instanceColor) crown.instanceColor.needsUpdate = true;
  });

  const geomCore = useMemo(() => new THREE.SphereGeometry(1, 18, 18), []);
  const geomHalo = useMemo(() => new THREE.SphereGeometry(1, 12, 12), []);
  const geomCrown = useMemo(() => new THREE.TorusGeometry(1.2, 0.12, 10, 32), []);

  return (
    <>
      <instancedMesh
        ref={haloRef}
        args={[geomHalo, undefined as any, nodes.length]}
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
        args={[geomCrown, undefined as any, nodes.length]}
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

      <instancedMesh
        ref={meshRef}
        args={[geomCore, undefined as any, nodes.length]}
        frustumCulled={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          const i = e.instanceId;
          if (typeof i === 'number') onHover(idsInOrder[i]);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          const i = e.instanceId;
          if (typeof i === 'number') onSelect(idsInOrder[i]);
        }}
      >
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  );
}
