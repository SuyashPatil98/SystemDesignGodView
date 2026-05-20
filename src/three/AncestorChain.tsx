import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { GNode } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  breadcrumbs: GNode[]; // root → ... → selected
  layout: Map<string, Positioned>;
}

// When a concept is selected, light up the path that leads back to its
// domain — a bright pulsing curve threading through every ancestor.
// Tells you *where* the selected node lives at a glance, in 3D.

const SEGMENTS_PER_LINK = 22;

export default function AncestorChain({ breadcrumbs, layout }: Props) {
  const { size } = useThree();
  const lineRef = useRef<LineSegments2 | null>(null);

  // Build the geometry — one bezier per parent/child link.
  const mesh = useMemo(() => {
    if (breadcrumbs.length < 2) return null;

    // Walk root → leaf; for each consecutive pair, sample a bezier and emit
    // contiguous segment pairs.
    const positions: number[] = [];
    let leafColor: THREE.Color | null = null;

    for (let i = 0; i < breadcrumbs.length - 1; i++) {
      const a = layout.get(breadcrumbs[i].id)?.position;       // parent
      const b = layout.get(breadcrumbs[i + 1].id)?.position;   // child
      if (!a || !b) continue;

      const mid = a.clone().add(b).multiplyScalar(0.5);
      const ctrl = mid.add(mid.clone().normalize().multiplyScalar(1.4));
      const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
      const pts = curve.getPoints(SEGMENTS_PER_LINK);

      for (let j = 0; j < pts.length - 1; j++) {
        positions.push(pts[j].x, pts[j].y, pts[j].z);
        positions.push(pts[j + 1].x, pts[j + 1].y, pts[j + 1].z);
      }
      if (i === breadcrumbs.length - 2) {
        leafColor = layout.get(breadcrumbs[i + 1].id)?.color?.clone() ?? null;
      }
    }

    if (positions.length === 0) return null;

    const geo = new LineSegmentsGeometry();
    geo.setPositions(positions);

    const mat = new LineMaterial({
      color: leafColor ?? new THREE.Color('#ffffff'),
      linewidth: 4.0,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      worldUnits: false,
      dashed: false,
    });
    mat.resolution.set(size.width, size.height);

    const obj = new LineSegments2(geo, mat);
    obj.frustumCulled = false;
    obj.renderOrder = 2;
    // Critical: decorative. Never participate in raycasting so we don't steal
    // clicks from the node icosahedrons beneath us.
    obj.raycast = () => {};
    return obj;
    // Resolution updates on size changes are handled in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadcrumbs, layout]);

  useEffect(() => {
    if (!mesh) return;
    const mat = (mesh as LineSegments2).material as LineMaterial;
    mat.resolution.set(size.width, size.height);
  }, [size, mesh]);

  useFrame(() => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as LineMaterial;
    const t = performance.now() / 1000;
    // Pulse 0.45 ↔ 1.0 at ~2.2 Hz.
    mat.opacity = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.2));
  });

  if (!mesh) return null;
  return <primitive ref={lineRef} object={mesh} />;
}
