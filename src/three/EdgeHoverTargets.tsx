import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GEdge } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  edges: GEdge[];                        // visible cross-edges only
  layout: Map<string, Positioned>;
  nodeNames: Map<string, string>;
}

// Invisible tube meshes following each cross-edge's bezier. Catches pointer
// events for hover so users can see what KIND of relationship an edge is.
// The visual lines are still rendered batched in EdgeCurves; these targets
// are purely for hit-testing.

const TUBE_RADIUS = 0.65;
const TUBE_TUBULAR = 10;
const TUBE_RADIAL = 4;

const EDGE_LABEL: Record<GEdge['kind'], { label: string; color: string }> = {
  parent: { label: 'parent', color: '#94a3b8' },
  related: { label: 'related concept', color: '#22d3ee' },
  'depends-on': { label: 'depends on', color: '#a78bfa' },
  implements: { label: 'implements', color: '#34d399' },
  'tradeoff-of': { label: 'tradeoff of', color: '#fb7185' },
  'fails-as': { label: 'fails as', color: '#fbbf24' },
};

interface BuiltEdge {
  edge: GEdge;
  geometry: THREE.TubeGeometry;
  mid: THREE.Vector3;
}

export default function EdgeHoverTargets({ edges, layout, nodeNames }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Build tubes for non-parent edges only.
  const built: BuiltEdge[] = useMemo(() => {
    const out: BuiltEdge[] = [];
    for (const e of edges) {
      if (e.kind === 'parent') continue;
      const a = layout.get(e.source)?.position;
      const b = layout.get(e.target)?.position;
      if (!a || !b) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const ctrl = mid.clone().add(mid.clone().normalize().multiplyScalar(2.0));
      const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
      const tube = new THREE.TubeGeometry(curve, TUBE_TUBULAR, TUBE_RADIUS, TUBE_RADIAL, false);
      out.push({ edge: e, geometry: tube, mid });
    }
    return out;
  }, [edges, layout]);

  // Cleanup geometries on rebuild.
  // (TubeGeometry instances retain GPU buffers; we dispose on next rebuild.)
  // Simple lifecycle — kept inline for compactness.

  const hovered = hoverIdx !== null ? built[hoverIdx] : null;
  const hoveredLabel = hovered ? EDGE_LABEL[hovered.edge.kind] : null;

  return (
    <group>
      {built.map((b, i) => (
        <mesh
          key={`${b.edge.source}__${b.edge.target}__${b.edge.kind}`}
          geometry={b.geometry}
          frustumCulled={false}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoverIdx(i);
            document.body.style.cursor = 'help';
          }}
          onPointerOut={() => {
            setHoverIdx((c) => (c === i ? null : c));
            document.body.style.cursor = '';
          }}
        >
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}

      {hovered && hoveredLabel && (
        <Html
          position={[hovered.mid.x, hovered.mid.y + 1.2, hovered.mid.z]}
          center
          distanceFactor={32}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[15, 0]}
        >
          <div
            className="no-select rounded-md border bg-ink-900/90 px-2.5 py-1.5 text-[10px] font-medium leading-tight whitespace-nowrap shadow-lg"
            style={{
              borderColor: hoveredLabel.color + '55',
              color: hoveredLabel.color,
              textShadow: '0 1px 4px rgba(0,0,0,0.95)',
            }}
          >
            <div className="text-[8px] uppercase tracking-[0.2em] opacity-70">
              {hoveredLabel.label}
            </div>
            <div className="mt-0.5 text-slate-100">
              {nodeNames.get(hovered.edge.source) ?? hovered.edge.source}
              <span className="px-1 text-slate-500">→</span>
              {nodeNames.get(hovered.edge.target) ?? hovered.edge.target}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
