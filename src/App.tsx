import { useCallback, useEffect, useMemo } from 'react';
import Scene from './three/Scene';
import TopBar from './ui/TopBar';
import LeftPanel from './ui/LeftPanel';
import NodeDetailOverlay from './ui/NodeDetailOverlay';
import ModeOverlay from './ui/ModeOverlay';
import KeyboardHints from './ui/KeyboardHints';
import MindmapView2D from './ui/MindmapView2D';
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
import { Focus, X, MousePointerClick } from 'lucide-react';
import type { GNode } from './data/schema';
import OnboardingTour from './ui/OnboardingTour';
import ComparePanel from './ui/ComparePanel';
import QuizModal from './ui/QuizModal';
import { parseUrl, replaceUrl } from './lib/urlState';

// Per-kind framing distance — wider for domains so the cluster reads,
// tight for leaves so the camera actually moves when you drill in.
// Without this every focus snaps to ~35 units regardless of kind, which
// makes clicking subdomains/concepts look like nothing happened (their
// position is only a few units off the parent domain).
function focusDistanceForKind(kind: GNode['kind'] | undefined): number {
  switch (kind) {
    case 'domain':
      return 55;
    case 'subdomain':
      return 22;
    case 'concept':
    case 'pattern':
    case 'tool':
    case 'metric':
    case 'failureMode':
      return 10;
    default:
      return 30;
  }
}

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
  // On mount: parse the query string and restore selection/mode/overlays.
  // We deliberately DO NOT restore focusedSubtreeId from the URL — focus
  // mode is a transient view, and a stuck ?f= in a bookmark would filter
  // every click and look like clicks are broken.
  useEffect(() => {
    // Strip any legacy ?f= from the URL so it can't sneak back in.
    if (new URLSearchParams(window.location.search).has('f')) {
      const next = new URLSearchParams(window.location.search);
      next.delete('f');
      const qs = next.toString();
      window.history.replaceState({}, '', qs ? `?${qs}` : window.location.pathname);
    }

    const s = parseUrl();
    if (s.mode) useGraphStore.getState().setMode(s.mode);
    if (s.activePathId) useGraphStore.getState().setActivePath(s.activePathId);
    if (s.activeProjectId) useGraphStore.getState().setActiveProject(s.activeProjectId);
    if (s.activeTradeoffId) useGraphStore.getState().setActiveTradeoff(s.activeTradeoffId);
    if (s.selectedId) {
      requestAnimationFrame(() => {
        useGraphStore.getState().select(s.selectedId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push relevant state back to the URL (focus excluded intentionally).
  useEffect(() => {
    replaceUrl({
      selectedId,
      mode,
      activePathId,
      activeProjectId,
      activeTradeoffId,
    });
  }, [selectedId, mode, activePathId, activeProjectId, activeTradeoffId]);

  // Combined select handler — every click on a domain/subdomain expands it
  // and opens the panel + focuses the camera. Wrapping `select` here means
  // re-clicking the same node still re-expands and re-focuses.
  const handleSelect = useCallback(
    (id: string) => {
      const state = useGraphStore.getState();
      const node = nodeById.get(id);
      if (node) {
        // CRITICAL: if focus mode is active and the user clicks a node whose
        // subtree wouldn't be visible under the current focus, clear focus.
        // Otherwise the new domain's subdomains stay hidden after expansion
        // (the focus filter overrides progressive disclosure).
        const focusedId = state.focusedSubtreeId;
        if (focusedId && focusedId !== id) {
          const focusSet = focusSubtreeIds({
            focusedId,
            nodes: graph.nodes,
            edges: graph.edges,
          });
          // If the clicked node is in the focus set but its descendants
          // wouldn't be, clearing focus is the right move so expansion shows.
          if (focusSet.has(id)) {
            // It's visible but children won't be — exit focus mode.
            state.setFocusedSubtree(null);
          }
          // (If not in focus set, the click can't have come from a click
          //  on a visible mesh — guard already in NodeMesh blocks it.)
        }

        if (node.kind === 'domain') {
          state.expandDomain(node.id);
        } else if (node.kind === 'subdomain') {
          if (node.parentId) state.expandDomain(node.parentId);
          state.expandSubdomain(node.id);
        } else if (node.parentId) {
          const parent = nodeById.get(node.parentId);
          if (parent?.kind === 'subdomain') {
            state.expandSubdomain(parent.id);
            if (parent.parentId) state.expandDomain(parent.parentId);
          }
        }
        state.markInteracted();
      }
      const pos = layout.get(id)?.position;
      if (pos) setFocus([pos.x, pos.y, pos.z], focusDistanceForKind(node?.kind));
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
    if (pos) setFocus([pos.x, pos.y, pos.z], focusDistanceForKind(node?.kind));
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
          // 2D map first → focus mode → selection. One step per ESC.
          if (useGraphStore.getState().mindmap2DOpen) {
            useGraphStore.getState().setMindmap2DOpen(false);
          } else if (focusedSubtreeId) setFocusedSubtree(null);
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
        case 'z': {
          // Zen mode — collapse both chrome panels in one keystroke,
          // or expand both if anything was open. Mirrors the visible
          // ▴ / ▾ and ◂ / ▸ tabs but flips them together.
          const s = useGraphStore.getState();
          const anyOpen = !s.navigatorCollapsed || !s.topbarCollapsed;
          s.setNavigatorCollapsed(anyOpen);
          s.setTopbarCollapsed(anyOpen);
          break;
        }
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
  }, [selectedId, layout, setFocus, setMode, select, focusedSubtreeId, setFocusedSubtree, handleSelect, childrenByParent]);

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
        onPick={handleSelect}
      />

      <NodeDetailOverlay
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

      <KeyboardHints />

      <MindmapView2D
        domains={graph.domains}
        nodes={graph.nodes}
        onPick={handleSelect}
      />

      {!hasInteracted && !focusedNode && (
        <div
          className="pointer-events-none absolute z-20 hidden md:flex items-center gap-2"
          style={{ left: 316, top: 140 }}
        >
          <div
            className="font-mono uppercase"
            style={{
              fontSize: 16,
              color: 'var(--mint)',
              textShadow: '0 0 8px var(--mint-dim)',
            }}
          >
            ←
          </div>
          <div
            className="flex flex-col gap-1 px-3 py-2 font-mono uppercase"
            style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.78)',
              border: '1px solid var(--mint-dim)',
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="flex items-center gap-2">
              <MousePointerClick size={11} style={{ color: 'var(--mint)' }} />
              Start here — pick a domain
            </div>
            <div
              className="font-serif italic normal-case"
              style={{
                fontSize: 11,
                letterSpacing: '0.01em',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              or click any glowing point in the galaxy
            </div>
          </div>
        </div>
      )}

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
            className="pointer-events-auto absolute bottom-5 right-5 z-20 flex items-center gap-2 px-3 py-1.5 font-mono uppercase backdrop-blur md:bottom-auto md:top-[124px]"
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.78)',
              border: '1px solid var(--mint-dim)',
              background: 'rgba(94,234,183,0.06)',
            }}
          >
            <span style={{ color: 'var(--mint)' }}>A:</span>
            <span style={{ color: '#fff', textTransform: 'none', letterSpacing: '0.02em' }} className="font-serif italic">
              {a.name}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>· shift-click another</span>
            <X size={11} style={{ color: 'rgba(255,255,255,0.45)' }} />
          </button>
        );
      })()}

      {focusedNode && (
        <button
          onClick={() => setFocusedSubtree(null)}
          className="pointer-events-auto absolute left-1/2 top-[78px] z-20 flex -translate-x-1/2 items-center gap-2 px-3.5 py-1.5 font-mono uppercase backdrop-blur"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.85)',
            border: '1px solid var(--mint)',
            background: 'rgba(94,234,183,0.08)',
            boxShadow: '0 0 22px rgba(94,234,183,0.18)',
          }}
        >
          <Focus size={12} style={{ color: 'var(--mint)' }} />
          Focused on{' '}
          <span
            className="font-serif italic"
            style={{
              color: '#fff',
              textTransform: 'none',
              letterSpacing: '0.02em',
            }}
          >
            {focusedNode.name}
          </span>
          <span
            className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5"
            style={{
              fontSize: 9,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <X size={10} /> Esc
          </span>
        </button>
      )}

    </div>
  );
}
