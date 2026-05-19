import { useEffect, useMemo } from 'react';
import Scene from './three/Scene';
import TopBar from './ui/TopBar';
import LeftPanel from './ui/LeftPanel';
import RightPanel from './ui/RightPanel';
import ModeOverlay from './ui/ModeOverlay';
import Minimap from './ui/Minimap';
import KeyboardHints from './ui/KeyboardHints';
import { useGraphStore } from './store/useGraphStore';
import {
  graph,
  nodeById,
  domainById,
  failureModeNodes,
  metricNodes,
  patternNodes,
  toolNodes,
} from './data';
import { computeLayout } from './three/layout';
import { breadcrumbs as bcrumbs } from './lib/breadcrumbs';
import { emphasizedIds } from './lib/modes';
import { focusSubtreeIds } from './lib/subtree';
import { Focus, X } from 'lucide-react';

export default function App() {
  const layout = useMemo(
    () => computeLayout(graph.domains, graph.nodes),
    [],
  );

  const selectedId = useGraphStore((s) => s.selectedId);
  const hoveredId = useGraphStore((s) => s.hoveredId);
  const mode = useGraphStore((s) => s.mode);
  const filters = useGraphStore((s) => s.filters);
  const activePathId = useGraphStore((s) => s.activePathId);
  const activeProjectId = useGraphStore((s) => s.activeProjectId);
  const activeTradeoffId = useGraphStore((s) => s.activeTradeoffId);
  const select = useGraphStore((s) => s.select);
  const hover = useGraphStore((s) => s.hover);
  const setFocus = useGraphStore((s) => s.setFocus);
  const setMode = useGraphStore((s) => s.setMode);
  const setShowMinimap = useGraphStore((s) => s.setShowMinimap);
  const showMinimap = useGraphStore((s) => s.showMinimap);
  const conquered = useGraphStore((s) => s.conquered);
  const showOnlyConquered = useGraphStore((s) => s.showOnlyConquered);
  const showOnlyUnconquered = useGraphStore((s) => s.showOnlyUnconquered);
  const focusedSubtreeId = useGraphStore((s) => s.focusedSubtreeId);
  const setFocusedSubtree = useGraphStore((s) => s.setFocusedSubtree);

  const domainIds = useMemo(
    () => new Set(graph.domains.map((d) => d.id)),
    [],
  );

  // Auto-focus camera when selection changes.
  useEffect(() => {
    if (!selectedId) return;
    const pos = layout.get(selectedId)?.position;
    if (pos) setFocus([pos.x, pos.y, pos.z]);
  }, [selectedId, layout, setFocus]);

  const breadcrumbs = useMemo(
    () => (selectedId ? bcrumbs(nodeById, selectedId) : []),
    [selectedId],
  );

  // Focus-mode subtree (overrides everything else when active).
  const focusVisible = useMemo(
    () =>
      focusedSubtreeId
        ? focusSubtreeIds({
            focusedId: focusedSubtreeId,
            nodes: graph.nodes,
            edges: graph.edges,
          })
        : null,
    [focusedSubtreeId],
  );

  // Compute visible node set from filters + conquest toggle.
  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const n of graph.nodes) {
      if (focusVisible && !focusVisible.has(n.id)) continue;
      if (
        filters.domainIds.size > 0 &&
        !filters.domainIds.has(n.domainId)
      )
        continue;
      if (
        filters.difficulty.size > 0 &&
        !filters.difficulty.has(n.difficulty)
      )
        continue;
      if (filters.layer.size > 0 && !filters.layer.has(n.layer))
        continue;
      if (
        n.interviewRelevance &&
        n.interviewRelevance < filters.minInterview
      )
        continue;
      if (
        n.productionRelevance &&
        n.productionRelevance < filters.minProduction
      )
        continue;

      // Conquest filter — domains always remain visible so the tree stays anchored.
      if (n.kind !== 'domain') {
        if (showOnlyConquered && !conquered.has(n.id)) continue;
        if (showOnlyUnconquered && conquered.has(n.id)) continue;
      }

      ids.add(n.id);
    }
    return ids;
  }, [filters, conquered, showOnlyConquered, showOnlyUnconquered, focusVisible]);

  // Focused node name for the "Exit focus" chip.
  const focusedNode = useMemo(
    () => (focusedSubtreeId ? nodeById.get(focusedSubtreeId) : null),
    [focusedSubtreeId],
  );

  const activePath = useMemo(
    () => graph.learningPaths.find((p) => p.id === activePathId) ?? null,
    [activePathId],
  );
  const activeProject = useMemo(
    () => graph.projects.find((p) => p.id === activeProjectId) ?? null,
    [activeProjectId],
  );
  const activeTradeoff = useMemo(
    () => graph.tradeoffs.find((t) => t.id === activeTradeoffId) ?? null,
    [activeTradeoffId],
  );

  const emphasized = useMemo(() => {
    const failureIds = failureModeNodes.map((n) => n.id);
    const metricIds = metricNodes.map((n) => n.id);
    const patternIds = patternNodes.map((n) => n.id);
    const toolIds = toolNodes.map((n) => n.id);

    return emphasizedIds({
      mode,
      allNodes: graph.nodes,
      activePathNodeIds: activePath?.nodeIds,
      activeProjectNodeIds: activeProject?.conceptIds,
      activeTradeoffNodeIds: activeTradeoff?.relatedNodeIds,
      failureModeIds: failureIds,
      metricIds,
      patternIds,
      toolIds,
    });
  }, [mode, activePath, activeProject, activeTradeoff]);

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      if (tgt && tgt.matches?.('input,textarea')) return;
      switch (e.key) {
        case 'Escape':
          if (focusedSubtreeId) setFocusedSubtree(null);
          else select(null);
          break;
        case 'f':
          if (selectedId) {
            const pos = layout.get(selectedId)?.position;
            if (pos) setFocus([pos.x, pos.y, pos.z]);
          }
          break;
        case 'c':
          setFocus([0, 0, 0]);
          break;
        case 'm':
          setShowMinimap(!showMinimap);
          break;
        case '1': setMode('galaxy'); break;
        case '2': setMode('learning-path'); break;
        case '3': setMode('project'); break;
        case '4': setMode('tradeoff'); break;
        case '5': setMode('failure-mode'); break;
        case '6': setMode('metric'); break;
        case '7': setMode('pattern'); break;
        case '8': setMode('tool'); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, layout, setFocus, setMode, select, setShowMinimap, showMinimap, focusedSubtreeId, setFocusedSubtree]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <Scene
        nodes={graph.nodes}
        edges={graph.edges}
        layout={layout}
        visibleIds={visibleIds}
        emphasized={emphasized}
        selectedId={selectedId}
        hoveredId={hoveredId}
        domainIds={domainIds}
        conquered={conquered}
        onHover={hover}
        onSelect={select}
      />

      <TopBar nodes={graph.nodes} onPickNode={select} />

      <LeftPanel
        domains={graph.domains}
        allNodes={graph.nodes}
        paths={graph.learningPaths}
        projects={graph.projects}
        tradeoffs={graph.tradeoffs}
        failureNodes={failureModeNodes}
        metricNodes={metricNodes}
        patternNodes={patternNodes}
        toolNodes={toolNodes}
      />

      <RightPanel
        nodes={nodeById}
        domains={domainById}
        breadcrumbs={breadcrumbs}
        onSelect={select}
      />

      <ModeOverlay
        paths={graph.learningPaths}
        projects={graph.projects}
        tradeoffs={graph.tradeoffs}
        nodes={nodeById}
        onSelect={select}
      />

      <Minimap
        nodes={graph.nodes}
        layout={layout}
        emphasized={emphasized}
        onPick={select}
      />

      <KeyboardHints />

      {focusedNode && (
        <button
          onClick={() => setFocusedSubtree(null)}
          className="pointer-events-auto absolute left-1/2 top-[78px] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-500/[0.08] px-3.5 py-1.5 text-[11px] font-semibold text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.35)] backdrop-blur"
        >
          <Focus size={12} />
          Focused on <span className="text-white">{focusedNode.name}</span>
          <span className="ml-1 inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-300">
            <X size={10} /> Esc to exit
          </span>
        </button>
      )}

      <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 text-[10px] font-mono text-slate-600">
        {graph.nodes.length} nodes · {graph.edges.length} edges · {graph.domains.length} domains
      </div>
    </div>
  );
}
