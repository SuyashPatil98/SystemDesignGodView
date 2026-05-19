import { useMemo } from 'react';
import * as THREE from 'three';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { useThree } from '@react-three/fiber';
import type { GEdge } from '../data/schema';
import type { Positioned } from './layout';

interface Props {
  edges: GEdge[];
  layout: Map<string, Positioned>;
  emphasized: Set<string> | null;
  selectedId: string | null;
  hoveredId: string | null;
  conquered: Set<string>;
}

// Two batched fat-line meshes:
//  - Parent edges (the mind-map skeleton): thick, vivid, colored by child domain.
//  - Cross edges (related/depends-on/...): thinner, dim by default, lit on focus.
//
// Each is built as a single LineSegments2 — every curve contributes (segments-1)
// independent segments so we never get stray stitching between separate edges.

const PARENT_SEGMENTS = 18;
const CROSS_SEGMENTS = 12;

function buildSegmentsMesh(args: {
  edges: GEdge[];
  layout: Map<string, Positioned>;
  emphasized: Set<string> | null;
  selectedId: string | null;
  hoveredId: string | null;
  conquered: Set<string>;
  isParent: boolean;
  segments: number;
  baseWidthPx: number;
  resolution: THREE.Vector2;
}): LineSegments2 | null {
  const {
    edges,
    layout,
    emphasized,
    selectedId,
    hoveredId,
    conquered,
    isParent,
    segments,
    baseWidthPx,
    resolution,
  } = args;

  if (edges.length === 0) return null;

  const positions: number[] = [];
  const colors: number[] = [];

  const gold = new THREE.Color('#fde68a');

  for (const e of edges) {
    const a = layout.get(e.source)?.position;
    const b = layout.get(e.target)?.position;
    if (!a || !b) continue;

    // Parent edges have source = child, target = parent. We want bright at the
    // child end and dim at the parent end, so the gradient reads as branches
    // *outward* from the trunk.
    // Cross edges fade between source and target colors (often different
    // domains) — looks gorgeous and tells you which domain pulls toward which.
    const aColor = layout.get(e.source)?.color?.clone() ?? new THREE.Color('#ffffff');
    const bColor = layout.get(e.target)?.color?.clone() ?? new THREE.Color('#ffffff');

    const touchesEmphasis =
      !emphasized || emphasized.has(e.source) || emphasized.has(e.target);
    const touchesSel =
      selectedId === e.source || selectedId === e.target;
    const touchesHover =
      hoveredId === e.source || hoveredId === e.target;
    const touchesConq =
      conquered.has(e.source) || conquered.has(e.target);

    let alpha = isParent ? 0.78 : 0.36;
    if (!touchesEmphasis) alpha *= 0.18;
    if (touchesSel) alpha = Math.min(1, alpha * 2.3);
    else if (touchesHover) alpha = Math.min(1, alpha * 1.7);
    if (touchesConq) alpha = Math.min(1, alpha + 0.12);

    // Endpoint colors (start = at a, end = at b).
    let startColor: THREE.Color;
    let endColor: THREE.Color;
    if (isParent) {
      // source is the child → bright; target is parent → dim.
      startColor = aColor.clone();
      endColor = aColor.clone().multiplyScalar(0.18);
    } else {
      startColor = aColor.clone();
      endColor = bColor.clone();
    }
    if (touchesConq) {
      startColor = startColor.lerp(gold, 0.55);
      endColor = endColor.lerp(gold, 0.4);
    }
    startColor.multiplyScalar(alpha);
    endColor.multiplyScalar(alpha);

    // Gentle outward bulge keeps the tree feeling organic.
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const outward = mid.clone().normalize();
    const bulge = isParent ? 1.2 : 2.0;
    const ctrl = mid.clone().add(outward.multiplyScalar(bulge));

    const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
    const pts = curve.getPoints(segments);

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const t0 = i / (pts.length - 1);
      const t1 = (i + 1) / (pts.length - 1);
      const c0 = startColor.clone().lerp(endColor, t0);
      const c1 = startColor.clone().lerp(endColor, t1);
      positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
      colors.push(c0.r, c0.g, c0.b, c1.r, c1.g, c1.b);
    }
  }

  if (positions.length === 0) return null;

  const geo = new LineSegmentsGeometry();
  geo.setPositions(positions);
  geo.setColors(colors);

  const mat = new LineMaterial({
    vertexColors: true,
    linewidth: baseWidthPx,
    transparent: true,
    depthWrite: false,
    worldUnits: false,
    dashed: false,
  });
  mat.resolution.copy(resolution);

  const mesh = new LineSegments2(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

export default function EdgeCurves({
  edges,
  layout,
  emphasized,
  selectedId,
  hoveredId,
  conquered,
}: Props) {
  const { size } = useThree();
  const resolution = useMemo(
    () => new THREE.Vector2(size.width, size.height),
    [size.width, size.height],
  );

  const { parentMesh, crossMesh } = useMemo(() => {
    const parentEdges = edges.filter((e) => e.kind === 'parent');
    const crossEdges = edges.filter((e) => e.kind !== 'parent');
    return {
      parentMesh: buildSegmentsMesh({
        edges: parentEdges,
        layout,
        emphasized,
        selectedId,
        hoveredId,
        conquered,
        isParent: true,
        segments: PARENT_SEGMENTS,
        baseWidthPx: 2.6,
        resolution,
      }),
      crossMesh: buildSegmentsMesh({
        edges: crossEdges,
        layout,
        emphasized,
        selectedId,
        hoveredId,
        conquered,
        isParent: false,
        segments: CROSS_SEGMENTS,
        baseWidthPx: 1.3,
        resolution,
      }),
    };
  }, [edges, layout, emphasized, selectedId, hoveredId, conquered, resolution]);

  return (
    <group>
      {crossMesh && <primitive object={crossMesh} />}
      {parentMesh && <primitive object={parentMesh} />}
    </group>
  );
}
