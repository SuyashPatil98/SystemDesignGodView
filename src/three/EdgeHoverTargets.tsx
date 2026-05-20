import { useEffect, useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GEdge } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  edges: GEdge[];                        // visible cross-edges only
  layout: Map<string, Positioned>;
  nodeNames: Map<string, string>;
}

// Edge hover tooltips — implemented in **screen space** so we never put any
// 3D mesh in the raycast path. The previous tube-mesh approach was stealing
// clicks from domains: R3F captures the pointer on any mesh with a hover
// handler, even when its material is invisible.
//
// Here we just project each edge's bezier sample points to screen space on
// pointermove and pick the closest one to the cursor within a pixel
// threshold. No meshes, no raycast interference. Clicks pass straight
// through to the nodes.

const SAMPLES_PER_EDGE = 9;
const PIXEL_THRESHOLD = 9;

const EDGE_LABEL: Record<GEdge['kind'], { label: string; color: string }> = {
  parent: { label: 'parent', color: '#94a3b8' },
  related: { label: 'related concept', color: '#22d3ee' },
  'depends-on': { label: 'depends on', color: '#a78bfa' },
  implements: { label: 'implements', color: '#34d399' },
  'tradeoff-of': { label: 'tradeoff of', color: '#fb7185' },
  'fails-as': { label: 'fails as', color: '#fbbf24' },
};

interface SampledEdge {
  edge: GEdge;
  samples: THREE.Vector3[];
  midPos: THREE.Vector3;
}

export default function EdgeHoverTargets({ edges, layout, nodeNames }: Props) {
  const { camera, gl, size } = useThree();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const sampled: SampledEdge[] = useMemo(() => {
    const out: SampledEdge[] = [];
    for (const e of edges) {
      if (e.kind === 'parent') continue;
      const a = layout.get(e.source)?.position;
      const b = layout.get(e.target)?.position;
      if (!a || !b) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const ctrl = mid.clone().add(mid.clone().normalize().multiplyScalar(2.0));
      const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
      out.push({
        edge: e,
        samples: curve.getPoints(SAMPLES_PER_EDGE),
        midPos: curve.getPoint(0.5),
      });
    }
    return out;
  }, [edges, layout]);

  // Canvas-level pointermove → project samples → find closest within threshold.
  useEffect(() => {
    const canvas = gl.domElement;
    const tmp = new THREE.Vector3();

    const onMove = (event: PointerEvent) => {
      // Skip when dragging — drag is camera, not hover.
      if (event.buttons !== 0) return;

      const rect = canvas.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      let bestIdx = -1;
      let bestDistSq = PIXEL_THRESHOLD * PIXEL_THRESHOLD;
      const halfW = size.width / 2;
      const halfH = size.height / 2;

      for (let i = 0; i < sampled.length; i++) {
        const samples = sampled[i].samples;
        for (let s = 0; s < samples.length; s++) {
          tmp.copy(samples[s]).project(camera);
          if (tmp.z < -1 || tmp.z > 1) continue;
          const dx = (tmp.x - ndcX) * halfW;
          const dy = (tmp.y - ndcY) * halfH;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDistSq) {
            bestDistSq = d2;
            bestIdx = i;
          }
        }
      }

      setHoverIdx((prev) => {
        const next = bestIdx === -1 ? null : bestIdx;
        if (next !== prev) {
          // Adjust cursor only when state changes (and never override an
          // existing 'pointer' from node hover — we use 'help' only).
          if (next !== null) document.body.style.cursor = 'help';
          else if (document.body.style.cursor === 'help') document.body.style.cursor = '';
        }
        return next;
      });
    };

    const onLeave = () => {
      setHoverIdx(null);
      if (document.body.style.cursor === 'help') document.body.style.cursor = '';
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [sampled, camera, gl, size]);

  const hovered = hoverIdx !== null ? sampled[hoverIdx] : null;
  const hoveredLabel = hovered ? EDGE_LABEL[hovered.edge.kind] : null;

  if (!hovered || !hoveredLabel) return null;

  return (
    <Html
      position={[hovered.midPos.x, hovered.midPos.y + 1.2, hovered.midPos.z]}
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
  );
}
