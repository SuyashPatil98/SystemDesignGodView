import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { computeClusterCentroids } from './layout';

// Region labels for the 6 super-clusters. Always visible. They name the
// neighbourhoods of the galaxy so the user knows what part of the universe
// they're looking at.
export default function ClusterLabels() {
  const centroids = useMemo(() => computeClusterCentroids(), []);

  return (
    <>
      {centroids.map((c) => (
        <Html
          key={c.id}
          position={[c.position.x, c.position.y, c.position.z]}
          center
          distanceFactor={140}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[12, 0]}
        >
          <div
            className="no-select whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.32em]"
            style={{
              color: c.color,
              textShadow: `0 0 18px ${c.color}, 0 0 4px rgba(0,0,0,0.85)`,
              letterSpacing: '0.32em',
              opacity: 0.9,
            }}
          >
            {c.name}
          </div>
        </Html>
      ))}
    </>
  );
}
