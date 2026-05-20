import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GEdge } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  edges: GEdge[];
  layout: Map<string, Positioned>;
  conquered: Set<string>;
}

// Travelling sparks along every visible parent edge. Each spark flows
// *outward* from the trunk (parent → child) on a 4-6s loop with a randomised
// phase so the galaxy looks like it has data flowing through it.
//
// Implementation: one InstancedMesh of octahedrons. Per frame, lerp each
// instance along its pre-computed bezier curve. Bloom does the rest.

const PERIOD_SEC = 5.0;
const SPARKS_PER_EDGE = 1;

interface SparkData {
  curve: THREE.QuadraticBezierCurve3;
  color: THREE.Color;
  phase: number;
}

export default function EdgeFlow({ edges, layout, conquered }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpCol = useMemo(() => new THREE.Color(), []);
  const gold = useMemo(() => new THREE.Color('#fde68a'), []);

  const sparks = useMemo<SparkData[]>(() => {
    const out: SparkData[] = [];
    for (const e of edges) {
      if (e.kind !== 'parent') continue;
      const aPos = layout.get(e.source)?.position;
      const bPos = layout.get(e.target)?.position;
      if (!aPos || !bPos) continue;
      // Parent edges are emitted as source=child, target=parent.
      // We want sparks flowing outward, parent → child, so child is `a`.
      const childPos = aPos;
      const parentPos = bPos;
      const childCol = layout.get(e.source)?.color.clone() ?? new THREE.Color('#ffffff');

      const mid = childPos.clone().add(parentPos).multiplyScalar(0.5);
      const outward = mid.clone().normalize();
      const ctrl = mid.clone().add(outward.multiplyScalar(1.2));
      // Curve is parent → child (so u=0 is at parent, u=1 is at child).
      const curve = new THREE.QuadraticBezierCurve3(parentPos, ctrl, childPos);

      for (let s = 0; s < SPARKS_PER_EDGE; s++) {
        out.push({
          curve,
          color: childCol.clone(),
          phase: Math.random(),
        });
      }
    }
    return out;
  }, [edges, layout]);

  const geometry = useMemo(() => new THREE.OctahedronGeometry(0.55, 0), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || sparks.length === 0) return;
    const now = performance.now() / 1000;

    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const u = ((now / PERIOD_SEC + sp.phase) % 1);
      const pos = sp.curve.getPoint(u);

      // Fade in/out at the endpoints so sparks don't pop.
      const fade =
        u < 0.06 ? u / 0.06 : u > 0.92 ? (1 - u) / 0.08 : 1.0;

      dummy.position.copy(pos);
      // Slight scale pulse along the path.
      const scale = 0.55 + 0.35 * Math.sin(u * Math.PI);
      dummy.scale.setScalar(scale * (0.5 + fade * 0.8));
      dummy.rotation.set(now * 0.6 + i, now * 0.4 + i, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      tmpCol.copy(sp.color).multiplyScalar(1.6 * fade);
      mesh.setColorAt(i, tmpCol);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  if (sparks.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined as any, sparks.length]}
      frustumCulled={false}
    >
      <meshBasicMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
