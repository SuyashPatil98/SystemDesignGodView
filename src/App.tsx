import { useCallback, useEffect, useMemo } from 'react';
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
import { Focus, X, MousePointerClick, MapPin } from 'lucide-react';
import { getClusters, domainColor } from './three/layout';
import OnboardingTour from './ui/OnboardingTour';
import ComparePanel from './ui/ComparePanel';
import QuizModal from './ui/QuizModal';
import { parseUrl, replaceUrl } from './lib/urlState';

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
  const expandedDomainIds = useGraphStore((s) => s.expandedDomainIds);
  const expandedSubdomainIds = useGraphStore((s) => s.expandedSubdomainIds);
  const toggleDomainExpanded = useGraphStore((s) => s.toggleDomainExpanded);
  const toggleSubdomainExpanded = useGraphStore((s) => s.toggleSubdomainExpanded);
  const hasInteracted = useGraphStore((s) => s.hasInteracted);
  const markInteracted = useGraphStore((s) => s.markInteracted);
  const nearestDomainId = useGraphStore((s) => s.nearestDomainId);
  const setActivePath = useGraphStore((s) => s.setActivePath);
  const setActiveProject = useGraphStore((s) => s.setActiveProject);
  const setActiveTradeoff = useGraphStore((s) => s.setActiveTradeoff);
  const addToCompare = useGraphStore((s) => s.addToCompare);
  const compareA = useGraphStore((s) => s.compareA);
  const compareB = useGraphStore((s) => s.compareB);
  const compareOpen = useGraphStore((s) => s.compareOpen);
  const clearCompare = useGraphStore((s) => s.clearCompare);

  const domainIds = useMemo(
    () => new Set(graph.domains.map((d) => d.id)),
    [],
  );

  // ─── URL deep-link sync ───
  // On mount, parse query string and restore state.
  useEffect(() => {
    const s = parseUrl();
    if (s.mode) useGraphStore.getState().setMode(s.mode);
    if (s.activePathId) useGraphStore.getState().setActivePath(s.activePathId);
    if (s.activeProjectId) useGraphStore.getState().setActiveProject(s.activeProjectId);
    if (s.activeTradeoffId) useGraphStore.getState().setActiveTradeoff(s.activeTradeoffId);
    if (s.focusedSubtreeId) useGraphStore.getState().setFocusedSubtree(s.focusedSubtreeId);
    if (s.selectedId) {
      requestAnimationFrame(() => {
        useGraphStore.getState().select(s.selectedId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push relevant state back to the URL.
  useEffect(() => {
    replaceUrl({
      selectedId,
      mode,
      focusedSubtreeId,
      activePathId,
      activeProjectId,
      activeTradeoffId,
    });
  }, [selectedId, mode, focusedSubtreeId, activePathId, activeProjectId, activeTradeoffId]);

  // Combined select handler — every click on a domain/subdomain expands it
  // and opens the panel + focuses the camera. Wrapping `select` here means
  // re-clicking the same node still re-expands and re-focuses.
  const handleSelect = useCallback(
    (id: string) => {
      const node = nodeById.get(id);
      if (node) {
        if (node.kind === 'domain') {
          useGraphStore.getState().expandDomain(node.id);
        } else if (node.kind === 'subdomain') {
          if (node.parentId) useGraphStore.getState().expandDomain(node.parentId);
          useGraphStore.getState().expandSubdomain(node.id);
        } else if (node.parentId) {
          const parent = nodeById.get(node.parentId);
          if (parent?.kind === 'subdomain') {
            useGraphStore.getState().expandSubdomain(parent.id);
            if (parent.parentId) useGraphStore.getState().expandDomain(parent.parentId);
          }
        }
        useGraphStore.getState().markInteracted();
      }
      const pos = layout.get(id)?.position;
      if (pos) setFocus([pos.x, pos.y, pos.z]);
      select(id);
    },
    [layout, setFocus, select],
  );

  // Also keep an effect for selection changes triggered from elsewhere
  // (search results, breadcrumb clicks, list items in the left panel).
  useEffect(() => {
    if (!selectedId) return;
    const node = nodeById.get(selectedId);
    if (node) {
      if (node.kind === 'domain') {
        useGraphStore.getState().expandDomain(node.id);
      } else if (node.kind === 'subdomain') {
        if (node.parentId) useGraphStore.getState().expandDomain(node.parentId);
        useGraphStore.getState().expandSubdomain(node.id);
      } else if (node.parentId) {
        const parent = nodeById.get(node.parentId);
        if (parent?.kind === 'subdomain') {
          useGraphStore.getState().expandSubdomain(parent.id);
          if (parent.parentId) useGraphStore.getState().expandDomain(parent.parentId);
        }
      }
      markInteracted();
    }
    const pos = layout.get(selectedId)?.position;
    if (pos) setFocus([pos.x, pos.y, pos.z]);
  }, [selectedId, layout, setFocus, markInteracted]);

  const breadcrumbs = useMemo(
    () => (selectedId ? bcrumbs(nodeById, selectedId) : []),
    [selectedId],
  );

  // When entering focus mode, frame the camera on the subtree's centroid.
  useEffect(() => {
    if (!focusedSubtreeId) return;
    // Recompute subtree members (cheap).
    const subtree = focusSubtreeIds({
      focusedId: focusedSubtreeId,
      nodes: graph.nodes,
      edges: graph.edges,
    });
    let cx = 0,
      cy = 0,
      cz = 0,
      n = 0;
    for (const id of subtree) {
      const p = layout.get(id)?.position;
      if (!p) continue;
      cx += p.x;
      cy += p.y;
      cz += p.z;
      n++;
    }
    if (n > 0) {
      setFocus([cx / n, cy / n, cz / n]);
    }
  }, [focusedSubtreeId, layout, setFocus]);

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

  // Ordered children per parent — used by arrow-key navigation.
  const childrenByParent = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const n of graph.nodes) {
      if (!n.parentId) continue;
      const arr = m.get(n.parentId) ?? [];
      arr.push(n.id);
      m.set(n.parentId, arr);
    }
    return m;
  }, []);

  // Build a parent → child kind map once: which subdomain's domain is expanded,
  // and which subdomain is expanded itself.
  const nodeKindParentExpanded = useMemo(() => {
    const m = new Map<string, 'domain' | 'sub' | 'concept' | 'unknown'>();
    for (const n of graph.nodes) {
      if (n.kind === 'domain') m.set(n.id, 'domain');
      else if (n.kind === 'subdomain') m.set(n.id, 'sub');
      else m.set(n.id, 'concept');
    }
    return m;
  }, []);

  // Modes that override progressive disclosure — when active, their nodes
  // are forced visible.
  const modeOverride = useMemo(() => {
    if (mode === 'galaxy') return null;
    const forceIds = new Set<string>();
    if (mode === 'failure-mode') failureModeNodes.forEach((n) => forceIds.add(n.id));
    else if (mode === 'metric') metricNodes.forEach((n) => forceIds.add(n.id));
    else if (mode === 'pattern') patternNodes.forEach((n) => forceIds.add(n.id));
    else if (mode === 'tool') toolNodes.forEach((n) => forceIds.add(n.id));
    if (mode === 'learning-path' && activePathId) {
      const p = graph.learningPaths.find((x) => x.id === activePathId);
      p?.nodeIds.forEach((id) => forceIds.add(id));
    }
    if (mode === 'project' && activeProjectId) {
      const p = graph.projects.find((x) => x.id === activeProjectId);
      p?.conceptIds.forEach((id) => forceIds.add(id));
    }
    return forceIds;
  }, [mode, activePathId, activeProjectId]);

  // Compute visible node set from filters + conquest toggle + progressive disclosure.
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

      // Progressive disclosure — only show what's been expanded into view.
      // Focus mode bypasses this; mode overrides also bypass.
      const isForced =
        !!focusVisible || (modeOverride !== null && modeOverride.has(n.id));
      if (!isForced) {
        if (n.kind === 'domain') {
          // Always visible.
        } else if (n.kind === 'subdomain') {
          if (!n.parentId || !expandedDomainIds.has(n.parentId)) continue;
        } else {
          // concept / pattern / tool / metric / failureMode
          // Walk up: parent should be an expanded subdomain.
          const parent = n.parentId ? nodeById.get(n.parentId) : undefined;
          if (!parent) continue;
          if (parent.kind === 'subdomain') {
            if (!expandedSubdomainIds.has(parent.id)) continue;
          } else if (parent.kind === 'concept') {
            // detail leaf — show if grandparent subdomain is expanded
            const grand = parent.parentId ? nodeById.get(parent.parentId) : undefined;
            if (!grand || !expandedSubdomainIds.has(grand.id)) continue;
          } else {
            continue;
          }
        }
      }

      ids.add(n.id);
    }
    return ids;
  }, [
    filters,
    conquered,
    showOnlyConquered,
    showOnlyUnconquered,
    focusVisible,
    expandedDomainIds,
    expandedSubdomainIds,
    modeOverride,
  ]);

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

        case 'ArrowUp': {
          e.preventDefault();
          if (!selectedId) {
            handleSelect(graph.domains[0].id);
            break;
          }
          const node = nodeById.get(selectedId);
          if (node?.parentId) handleSelect(node.parentId);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          if (!selectedId) {
            handleSelect(graph.domains[0].id);
            break;
          }
          const kids = childrenByParent.get(selectedId);
          if (kids && kids.length) handleSelect(kids[0]);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowRight': {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          if (!selectedId) {
            handleSelect(graph.domains[0].id);
            break;
          }
          const node = nodeById.get(selectedId);
          if (!node) break;
          if (node.kind === 'domain') {
            const idx = graph.domains.findIndex((d) => d.id === node.id);
            if (idx < 0) break;
            const len = graph.domains.length;
            const next = graph.domains[(idx + dir + len) % len].id;
            handleSelect(next);
          } else if (node.parentId) {
            const sibs = childrenByParent.get(node.parentId);
            if (!sibs || sibs.length === 0) break;
            const idx = sibs.indexOf(node.id);
            if (idx < 0) break;
            const len = sibs.length;
            handleSelect(sibs[(idx + dir + len) % len]);
          }
          break;
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, layout, setFocus, setMode, select, setShowMinimap, showMinimap, focusedSubtreeId, setFocusedSubtree, handleSelect, childrenByParent]);

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
        breadcrumbs={breadcrumbs}
        focusedSubtreeId={focusedSubtreeId}
        onHover={hover}
        onSelect={handleSelect}
        onShiftSelect={addToCompare}
      />

      <TopBar nodes={graph.nodes} onPickNode={handleSelect} />

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
        onSelect={handleSelect}
      />

      <ModeOverlay
        paths={graph.learningPaths}
        projects={graph.projects}
        tradeoffs={graph.tradeoffs}
        nodes={nodeById}
        onSelect={handleSelect}
      />

      <Minimap
        nodes={graph.nodes}
        layout={layout}
        emphasized={emphasized}
        onPick={handleSelect}
      />

      <KeyboardHints />

      {!hasInteracted && !focusedNode && (
        <div className="pointer-events-none absolute left-1/2 top-[78px] z-20 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-cyan-300/40 bg-ink-900/85 px-3.5 py-2 text-[12px] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.35)] backdrop-blur animate-slow-pulse">
            <MousePointerClick size={13} className="text-cyan-300" />
            Click any <span className="font-semibold text-white">domain</span> to expand its branches
          </div>
        </div>
      )}

      {/* "You are here" — only when user has started exploring and isn't in
          focus mode (focus chip already occupies that slot). */}
      {hasInteracted && !focusedNode && nearestDomainId && (() => {
        const domain = domainById.get(nearestDomainId);
        if (!domain) return null;
        const cluster = getClusters().find((c) =>
          c.domainIds.includes(nearestDomainId),
        );
        const color = domainColor(nearestDomainId);
        return (
          <div className="pointer-events-none absolute left-1/2 top-[80px] z-10 -translate-x-1/2 select-none">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/55 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] backdrop-blur">
              <MapPin size={11} style={{ color }} />
              {cluster && (
                <>
                  <span className="text-slate-400">{cluster.name}</span>
                  <span className="text-slate-600">/</span>
                </>
              )}
              <span className="text-white" style={{ textShadow: `0 0 10px ${color}66` }}>
                {domain.name}
              </span>
            </div>
          </div>
        );
      })()}

      <OnboardingTour />

      <ComparePanel nodes={nodeById} onSelect={handleSelect} />
      <QuizModal nodes={graph.nodes} domains={graph.domains} />

      {/* Pending-compare chip — A is picked but B isn't yet. */}
      {compareA && !compareB && !compareOpen && (() => {
        const a = nodeById.get(compareA);
        if (!a) return null;
        return (
          <button
            onClick={() => clearCompare()}
            className="pointer-events-auto absolute bottom-5 right-5 z-20 flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/[0.08] px-3 py-1.5 text-[11px] text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.25)] backdrop-blur md:bottom-auto md:top-[124px]"
          >
            <span className="text-emerald-300">A:</span>
            <span className="text-white">{a.name}</span>
            <span className="text-slate-400">· shift-click another to compare</span>
            <X size={11} className="text-slate-400" />
          </button>
        );
      })()}

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

      <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 hidden md:block text-[10px] font-mono text-slate-600">
        {graph.nodes.length} nodes · {graph.edges.length} edges · {graph.domains.length} domains
      </div>
    </div>
  );
}
