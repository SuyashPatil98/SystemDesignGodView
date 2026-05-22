import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { GNode, GEdge } from '../data/schema';
import type { Positioned } from './layout';
import NodeMesh from './NodeMesh';
import EdgeCurves from './EdgeCurves';
import EdgeFlow from './EdgeFlow';
import EdgeHoverTargets from './EdgeHoverTargets';
import LODLabels from './LODLabels';
import ClusterLabels from './ClusterLabels';
import ClusterNebulae from './ClusterNebulae';
import DustField from './DustField';
import AncestorChain from './AncestorChain';
import NearestDomainTracker from './NearestDomainTracker';
import { domains as ALL_DOMAINS } from '../data/domains';

interface Props {
  nodes: GNode[];
  edges: GEdge[];
  layout: Map<string, Positioned>;
  visibleIds: Set<string>;
  emphasized: Set<string> | null;
  selectedId: string | null;
  hoveredId: string | null;
  domainIds: Set<string>;
  conquered: Set<string>;
  breadcrumbs: GNode[];          // for ancestor chain pulse
  focusedSubtreeId: string | null;  // drives ambient dim
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onShiftSelect?: (id: string) => void;
}

export default function GalaxyGraph({
  nodes,
  edges,
  layout,
  visibleIds,
  emphasized,
  selectedId,
  hoveredId,
  domainIds,
  conquered,
  breadcrumbs,
  focusedSubtreeId,
  onHover,
  onSelect,
  onShiftSelect,
}: Props) {
  const visibleNodes = useMemo(
    () => nodes.filter((n) => visibleIds.has(n.id)),
    [nodes, visibleIds],
  );
  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) => visibleIds.has(e.source) && visibleIds.has(e.target),
      ),
    [edges, visibleIds],
  );

  const domainLabels = useMemo(
    () =>
      visibleNodes
        .filter((n) => domainIds.has(n.id))
        .map((n) => ({ node: n, pos: layout.get(n.id)?.position })),
    [visibleNodes, layout, domainIds],
  );

  const selectedLabel = useMemo(() => {
    if (!selectedId) return null;
    const node = nodes.find((n) => n.id === selectedId);
    const pos = layout.get(selectedId)?.position;
    if (!node || !pos) return null;
    return { node, pos };
  }, [selectedId, nodes, layout]);

  const hoveredLabel = useMemo(() => {
    if (!hoveredId || hoveredId === selectedId) return null;
    const node = nodes.find((n) => n.id === hoveredId);
    const pos = layout.get(hoveredId)?.position;
    if (!node || !pos) return null;
    return { node, pos };
  }, [hoveredId, selectedId, nodes, layout]);

  // When focus mode is on, dim the ambient (stars/dust/nebulae) so the
  // isolated subtree visually pops.
  const ambientOpacity = focusedSubtreeId ? 0.28 : 1.0;

  // Node-name lookup map for edge tooltips.
  const nodeNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nodes) m.set(n.id, n.name);
    return m;
  }, [nodes]);

  return (
    <group>
      <ClusterNebulae ambientOpacity={ambientOpacity} />
      <DustField ambientOpacity={ambientOpacity} />

      <EdgeCurves
        edges={visibleEdges}
        layout={layout}
        emphasized={emphasized}
        selectedId={selectedId}
        hoveredId={hoveredId}
        conquered={conquered}
      />

      <EdgeFlow edges={visibleEdges} layout={layout} conquered={conquered} />

      <EdgeHoverTargets
        edges={visibleEdges}
        layout={layout}
        nodeNames={nodeNames}
      />

      <AncestorChain breadcrumbs={breadcrumbs} layout={layout} />

      <NodeMesh
        nodes={nodes}
        visibleIds={visibleIds}
        layout={layout}
        selectedId={selectedId}
        hoveredId={hoveredId}
        emphasized={emphasized}
        conquered={conquered}
        onHover={onHover}
        onSelect={onSelect}
        onShiftSelect={onShiftSelect}
      />

      <LODLabels
        nodes={visibleNodes}
        layout={layout}
        visibleIds={visibleIds}
        conquered={conquered}
        selectedId={selectedId}
      />

      <ClusterLabels />

      <NearestDomainTracker domains={ALL_DOMAINS} layout={layout} />

      {domainLabels.map(({ node, pos }) =>
        pos ? (
          <Html
            key={node.id}
            position={[pos.x, pos.y + 7.5, pos.z]}
            center
            distanceFactor={45}
            style={{ pointerEvents: 'none' }}
            zIndexRange={[11, 0]}
          >
            <div
              className="no-select whitespace-nowrap px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.2em] text-white"
              style={{
                textShadow:
                  '0 0 14px rgba(255,255,255,0.55), 0 0 4px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.85)',
              }}
            >
              {node.name}
            </div>
          </Html>
        ) : null,
      )}

      {selectedLabel && (
        <Html
          position={[
            selectedLabel.pos.x,
            selectedLabel.pos.y + 2.4,
            selectedLabel.pos.z,
          ]}
          center
          distanceFactor={20}
          style={{ pointerEvents: 'none' }}
        >
          <div className="no-select rounded-md border border-cyan-300/50 bg-ink-900/85 px-2.5 py-1 text-[11px] text-cyan-100 whitespace-nowrap shadow-[0_0_22px_rgba(34,211,238,0.45)]">
            {selectedLabel.node.name}
          </div>
        </Html>
      )}

      {hoveredLabel && (
        <Html
          position={[
            hoveredLabel.pos.x,
            hoveredLabel.pos.y + 1.8,
            hoveredLabel.pos.z,
          ]}
          center
          distanceFactor={24}
          style={{ pointerEvents: 'none' }}
        >
          <div className="no-select rounded-md border border-white/15 bg-ink-900/85 px-2 py-1 text-[10px] text-slate-200 whitespace-nowrap">
            {hoveredLabel.node.name}
          </div>
        </Html>
      )}
    </group>
  );
}
