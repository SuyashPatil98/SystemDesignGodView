import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { computeClusterCentroids, getClusters } from './layout';
import { useGraphStore } from '../store/useGraphStore';
import { nodeById } from '../data';

// Region labels for the 6 super-clusters. Always visible. Single mint accent
// for all six — c.color is intentionally ignored; the design language is
// one-accent (Surface .06/.07).
//
// When a node is selected, the cluster containing it stays bright and the
// others dim so the eye has somewhere to land. Without this every cluster
// label competes equally with the overlay's domain title.
export default function ClusterLabels() {
  const centroids = useMemo(() => computeClusterCentroids(), []);
  const selectedId = useGraphStore((s) => s.selectedId);

  const activeClusterId = useMemo(() => {
    if (!selectedId) return null;
    const node = nodeById.get(selectedId);
    if (!node) return null;
    // graph data is a closed set, walk the canonical cluster list.
    const cluster = getClusters().find((c) =>
      c.domainIds.includes(node.domainId),
    );
    return cluster?.id ?? null;
  }, [selectedId]);

  return (
    <>
      {centroids.map((c) => {
        const dim = activeClusterId !== null && c.id !== activeClusterId;
        return (
          <Html
            key={c.id}
            position={[c.position.x, c.position.y, c.position.z]}
            center
            distanceFactor={140}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[12, 0]}
          >
            <div
              className="no-select whitespace-nowrap font-sans uppercase"
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.32em',
                color: '#fff',
                textShadow:
                  '0 0 14px var(--mint-dim), 0 0 4px rgba(0,0,0,0.95)',
                opacity: dim ? 0.22 : 0.92,
                transition: 'opacity 220ms ease-out',
              }}
            >
              {c.name}
            </div>
          </Html>
        );
      })}
    </>
  );
}
