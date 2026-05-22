import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { useThree } from '@react-three/fiber';
import { useGraphStore } from '../store/useGraphStore';
import type { GEdge } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  edges: GEdge[];
  layout: Map<string, Positioned>;
  // Kept in the signature so the call-site doesn't break; not used visually.
  emphasized?: Set<string> | null;
  selectedId?: string | null;
  hoveredId?: string | null;
  conquered?: Set<string>;
}

// Surface .05 — every edge is a dim mint hairline. Parent edges are a hair
// brighter than cross-edges, but the per-kind rainbow + per-edge highlights
// from before are gone. Selection emphasis is now the AncestorChain
// component's job.

const PARENT_SEGMENTS = 18;
const CROSS_SEGMENTS = 12;

function buildSegmentsMesh(args: {
  edges: GEdge[];
  layout: Map<string, Positioned>;
  segments: number;
  widthPx: number;
  alpha: number;
  resolution: THREE.Vector2;
  color: THREE.Color;
}): LineSegments2 | null {
  const { edges, layout, segments, widthPx, alpha, resolution, color } = args;
  if (edges.length === 0) return null;

  const positions: number[] = [];

  for (const e of edges) {
    const a = layout.get(e.source)?.position;
    const b = layout.get(e.target)?.position;
    if (!a || !b) continue;

    // Gentle outward bulge so paths read as organic rather than rigid.
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const outward = mid.clone().normalize();
    const ctrl = mid.clone().add(outward.multiplyScalar(1.2));

    const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
    const pts = curve.getPoints(segments);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
    }
  }

  if (positions.length === 0) return null;

  const geo = new LineSegmentsGeometry();
  geo.setPositions(positions);

  const mat = new LineMaterial({
    color: color.getHex(),
    linewidth: widthPx,
    transparent: true,
    opacity: alpha,
    depthWrite: false,
    worldUnits: false,
    dashed: false,
  });
  mat.resolution.copy(resolution);

  const mesh = new LineSegments2(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

export default function EdgeCurves({ edges, layout }: Props) {
  const { size } = useThree();
  const palette = useGraphStore((s) => s.palette);

  const resolution = useMemo(
    () => new THREE.Vector2(size.width, size.height),
    [size.width, size.height],
  );

  // Single mint color shared by both passes.
  const color = useMemo(
    () => new THREE.Color(palette === 'mint' ? '#5EEAB7' : '#B5A0FF'),
    [palette],
  );

  const { parentMesh, crossMesh } = useMemo(() => {
    const parentEdges = edges.filter((e) => e.kind === 'parent');
    const crossEdges = edges.filter((e) => e.kind !== 'parent');
    return {
      parentMesh: buildSegmentsMesh({
        edges: parentEdges,
        layout,
        segments: PARENT_SEGMENTS,
        widthPx: 1.3,
        alpha: 0.32,
        resolution,
        color,
      }),
      crossMesh: buildSegmentsMesh({
        edges: crossEdges,
        layout,
        segments: CROSS_SEGMENTS,
        widthPx: 1.0,
        alpha: 0.18,
        resolution,
        color,
      }),
    };
  }, [edges, layout, resolution, color]);

  // Dispose previous meshes when rebuilt.
  useEffect(() => {
    return () => {
      if (parentMesh) {
        parentMesh.geometry.dispose();
        (parentMesh.material as LineMaterial).dispose();
      }
      if (crossMesh) {
        crossMesh.geometry.dispose();
        (crossMesh.material as LineMaterial).dispose();
      }
    };
  }, [parentMesh, crossMesh]);

  return (
    <group>
      {crossMesh && <primitive object={crossMesh} />}
      {parentMesh && <primitive object={parentMesh} />}
    </group>
  );
}
