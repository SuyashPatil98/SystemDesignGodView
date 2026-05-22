import { useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { GNode } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  nodes: GNode[];
  layout: Map<string, Positioned>;
  visibleIds: Set<string>;
  conquered: Set<string>;
  selectedId: string | null;
}

// Show small text labels for the nodes nearest the camera. Bounded to
// MAX_VISIBLE to keep DOM work constant regardless of node count.
//
// Update is throttled to ~5 fps via a ref-driven setState so the label set
// only changes when the camera materially moves.

const MAX_VISIBLE = 28;
const UPDATE_INTERVAL_MS = 220;

const DIST_THRESHOLD: Record<string, number> = {
  subdomain: 220,
  concept: 110,
  pattern: 110,
  metric: 110,
  failureMode: 110,
  tool: 110,
};

export default function LODLabels({
  nodes,
  layout,
  visibleIds,
  conquered,
  selectedId,
}: Props) {
  const { camera } = useThree();
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const lastUpdate = useRef(0);
  const lastSig = useRef('');

  // Candidates we ever consider labelling.
  const candidates = useMemo(
    () =>
      nodes.filter(
        (n) =>
          n.kind !== 'domain' &&
          DIST_THRESHOLD[n.kind] !== undefined &&
          visibleIds.has(n.id),
      ),
    [nodes, visibleIds],
  );

  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdate.current < UPDATE_INTERVAL_MS) return;
    lastUpdate.current = now;

    const camPos = camera.position;
    const scored: Array<{ id: string; d: number; threshold: number }> = [];
    for (const n of candidates) {
      const p = layout.get(n.id)?.position;
      if (!p) continue;
      const threshold = DIST_THRESHOLD[n.kind];
      const d = camPos.distanceTo(p);
      if (d > threshold) continue;
      scored.push({ id: n.id, d, threshold });
    }
    scored.sort((a, b) => a.d - b.d);

    // Don't include the selected node — the NodeDetailOverlay already
    // renders its name as the canonical headline; the world-space pill
    // would just stack a duplicate behind it.
    const next = scored
      .slice(0, MAX_VISIBLE)
      .map((x) => x.id)
      .filter((id) => id !== selectedId);

    const sig = next.join('|');
    if (sig !== lastSig.current) {
      lastSig.current = sig;
      setLabelIds(next);
    }
  });

  const byId = useMemo(() => new Map<string, GNode>(nodes.map((n) => [n.id, n])), [nodes]);

  return (
    <>
      {labelIds.map((id) => {
        const n = byId.get(id);
        const pos = layout.get(id)?.position;
        if (!n || !pos) return null;
        const isConq = conquered.has(id);
        const isSel = id === selectedId;
        const lift =
          n.kind === 'subdomain' ? 2.4 : n.kind === 'concept' ? 1.4 : 1.0;
        return (
          <Html
            key={id}
            position={[pos.x, pos.y + lift, pos.z]}
            center
            distanceFactor={n.kind === 'subdomain' ? 36 : 22}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[8, 0]}
          >
            <div
              className="no-select whitespace-nowrap px-1.5 py-0.5 text-[10px] font-medium font-sans"
              style={{
                color: isSel
                  ? '#fff'
                  : isConq
                  ? 'var(--mint)'
                  : 'rgba(255,255,255,0.78)',
                textShadow: isSel
                  ? '0 0 10px var(--mint-dim), 0 1px 4px rgba(0,0,0,0.95)'
                  : '0 1px 4px rgba(0,0,0,0.85)',
              }}
            >
              {n.name}
            </div>
          </Html>
        );
      })}
    </>
  );
}
