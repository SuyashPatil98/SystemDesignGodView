import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, RotateCcw, Sparkles, Boxes, Network, AlertTriangle, Gauge, Layers, Wrench, Crown, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import GlassPanel from './primitives/GlassPanel';
import Chip from './primitives/Chip';
import Section from './primitives/Section';
import { useGraphStore } from '../store/useGraphStore';
import type { Domain, Difficulty, Layer, LearningPath, ProjectIdea, Tradeoff, GNode } from '../data/schema';
import { domainColor } from '../three/layout';

interface Props {
  domains: Domain[];
  allNodes: GNode[];
  paths: LearningPath[];
  projects: ProjectIdea[];
  tradeoffs: Tradeoff[];
  failureNodes: GNode[];
  metricNodes: GNode[];
  patternNodes: GNode[];
  toolNodes: GNode[];
}

const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const layers: Layer[] = ['conceptual', 'architectural', 'implementation', 'operational', 'optimization'];

export default function LeftPanel({
  domains,
  allNodes,
  paths,
  projects,
  tradeoffs,
  failureNodes,
  metricNodes,
  patternNodes,
  toolNodes,
}: Props) {
  const mode = useGraphStore((s) => s.mode);
  const filters = useGraphStore((s) => s.filters);
  const activePathId = useGraphStore((s) => s.activePathId);
  const activeProjectId = useGraphStore((s) => s.activeProjectId);
  const activeTradeoffId = useGraphStore((s) => s.activeTradeoffId);
  const toggleDomain = useGraphStore((s) => s.toggleDomainFilter);
  const toggleDifficulty = useGraphStore((s) => s.toggleDifficulty);
  const toggleLayer = useGraphStore((s) => s.toggleLayer);
  const setMinInterview = useGraphStore((s) => s.setMinInterview);
  const setMinProduction = useGraphStore((s) => s.setMinProduction);
  const resetFilters = useGraphStore((s) => s.resetFilters);
  const setActivePath = useGraphStore((s) => s.setActivePath);
  const setActiveProject = useGraphStore((s) => s.setActiveProject);
  const setActiveTradeoff = useGraphStore((s) => s.setActiveTradeoff);
  const select = useGraphStore((s) => s.select);

  const conquered = useGraphStore((s) => s.conquered);
  const showOnlyConquered = useGraphStore((s) => s.showOnlyConquered);
  const showOnlyUnconquered = useGraphStore((s) => s.showOnlyUnconquered);
  const setShowOnlyConquered = useGraphStore((s) => s.setShowOnlyConquered);
  const setShowOnlyUnconquered = useGraphStore((s) => s.setShowOnlyUnconquered);
  const clearConquered = useGraphStore((s) => s.clearConquered);

  const expandedDomainIds = useGraphStore((s) => s.expandedDomainIds);
  const expandedSubdomainIds = useGraphStore((s) => s.expandedSubdomainIds);
  const toggleDomainExpanded = useGraphStore((s) => s.toggleDomainExpanded);
  const expandAll = useGraphStore((s) => s.expandAll);
  const collapseAll = useGraphStore((s) => s.collapseAll);
  const mobileMenuOpen = useGraphStore((s) => s.mobileMenuOpen);

  const filtersActive =
    filters.domainIds.size > 0 ||
    filters.difficulty.size > 0 ||
    filters.layer.size > 0 ||
    filters.minInterview > 1 ||
    filters.minProduction > 1 ||
    showOnlyConquered ||
    showOnlyUnconquered;

  // Per-domain conquest stats.
  const domainStats = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const n of allNodes) {
      if (n.kind === 'domain') continue;
      const s = map.get(n.domainId) ?? { total: 0, done: 0 };
      s.total++;
      if (conquered.has(n.id)) s.done++;
      map.set(n.domainId, s);
    }
    return map;
  }, [allNodes, conquered]);

  const modeListNodes = useMemo(() => {
    switch (mode) {
      case 'failure-mode':
        return failureNodes;
      case 'metric':
        return metricNodes;
      case 'pattern':
        return patternNodes;
      case 'tool':
        return toolNodes;
      default:
        return [];
    }
  }, [mode, failureNodes, metricNodes, patternNodes, toolNodes]);

  return (
    <GlassPanel
      className={`pointer-events-auto absolute top-[68px] bottom-5 z-10 flex flex-col transition-all duration-200
        sm:left-5 sm:w-[300px]
        ${mobileMenuOpen ? 'left-3 right-3 sm:right-auto' : 'hidden sm:flex'}
      `}
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-cyan-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
            Navigator
          </span>
        </div>
        {filtersActive && (
          <button
            onClick={() => {
              resetFilters();
              setShowOnlyConquered(false);
              setShowOnlyUnconquered(false);
            }}
            className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/5"
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
        {/* Expand / collapse controls — always at top */}
        <Section title="View" defaultOpen>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Chip
                tone="violet"
                onClick={() => {
                  const subIds = allNodes
                    .filter((n) => n.kind === 'subdomain')
                    .map((n) => n.id);
                  expandAll(domains.map((d) => d.id), subIds);
                }}
              >
                <ChevronDown size={11} /> Expand all
              </Chip>
              <Chip
                tone="slate"
                onClick={collapseAll}
                active={expandedDomainIds.size === 0 && expandedSubdomainIds.size === 0}
              >
                <ChevronUp size={11} /> Collapse all
              </Chip>
            </div>
            <p className="text-[10px] leading-snug text-slate-500">
              Click a domain to expand it. Click a subdomain to drill deeper. Use Isolate from the right panel to study a branch alone.
            </p>
          </div>
        </Section>

        {/* Conquest section */}
        <Section title="Conquest" defaultOpen tone="warn">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <Chip
                tone="amber"
                active={showOnlyConquered}
                onClick={() => setShowOnlyConquered(!showOnlyConquered)}
              >
                <Crown size={11} /> Show conquered
              </Chip>
              <Chip
                tone="slate"
                active={showOnlyUnconquered}
                onClick={() => setShowOnlyUnconquered(!showOnlyUnconquered)}
              >
                Show only unconquered
              </Chip>
            </div>

            <div className="space-y-1">
              {domains.map((d) => {
                const s = domainStats.get(d.id);
                const total = s?.total ?? 0;
                const done = s?.done ?? 0;
                const pct = total > 0 ? (done / total) * 100 : 0;
                const col = domainColor(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDomain(d.id)}
                    className={`group flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[11px] transition ${
                      filters.domainIds.has(d.id)
                        ? 'border-white/30 bg-white/[0.04]'
                        : 'border-white/[0.04] hover:border-white/15'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: col, boxShadow: `0 0 8px ${col}` }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-200">
                      {d.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1 w-12 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: col, boxShadow: `0 0 6px ${col}` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                        {done}/{total}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {conquered.size > 0 && (
              <button
                onClick={clearConquered}
                className="w-full rounded-md border border-rose-300/20 px-2 py-1 text-[10px] text-rose-300/80 hover:bg-rose-500/[0.06]"
              >
                Reset all conquest progress
              </button>
            )}
          </div>
        </Section>

        {/* Mode-specific lists */}
        <AnimatePresence>
          {mode === 'learning-path' && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Section title="Learning paths" defaultOpen count={paths.length}>
                <ul className="space-y-1">
                  {paths.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => setActivePath(activePathId === p.id ? null : p.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          activePathId === p.id
                            ? 'border-violet-300/60 bg-violet-500/10 text-violet-100'
                            : 'border-white/5 bg-white/[0.02] text-slate-200 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles size={12} className="text-violet-300" />
                          <span className="truncate text-[12px] font-semibold">{p.name}</span>
                        </div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">{p.description}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            </motion.div>
          )}

          {mode === 'project' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Section title="Projects" defaultOpen count={projects.length}>
                <ul className="space-y-1">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => setActiveProject(activeProjectId === p.id ? null : p.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          activeProjectId === p.id
                            ? 'border-emerald-300/60 bg-emerald-500/10 text-emerald-100'
                            : 'border-white/5 bg-white/[0.02] text-slate-200 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Boxes size={12} className="text-emerald-300" />
                          <span className="truncate text-[12px] font-semibold">{p.name}</span>
                        </div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">{p.oneLiner}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            </motion.div>
          )}

          {mode === 'tradeoff' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Section title="Tradeoffs" defaultOpen count={tradeoffs.length}>
                <ul className="space-y-1">
                  {tradeoffs.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => setActiveTradeoff(activeTradeoffId === t.id ? null : t.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                          activeTradeoffId === t.id
                            ? 'border-rose-300/60 bg-rose-500/10 text-rose-100'
                            : 'border-white/5 bg-white/[0.02] text-slate-200 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Network size={12} className="text-rose-300" />
                          <span className="truncate text-[12px] font-semibold">{t.name}</span>
                        </div>
                        <div className="mt-1 line-clamp-1 text-[11px] text-slate-400">{t.axis}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Section>
            </motion.div>
          )}

          {(mode === 'failure-mode' || mode === 'metric' || mode === 'pattern' || mode === 'tool') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Section
                title={
                  mode === 'failure-mode'
                    ? 'Failure modes'
                    : mode === 'metric'
                    ? 'Metrics'
                    : mode === 'pattern'
                    ? 'Architecture patterns'
                    : 'Tools'
                }
                defaultOpen
                count={modeListNodes.length}
              >
                <ul className="space-y-1">
                  {modeListNodes.map((n) => {
                    const Icon =
                      mode === 'failure-mode'
                        ? AlertTriangle
                        : mode === 'metric'
                        ? Gauge
                        : mode === 'pattern'
                        ? Layers
                        : Wrench;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => select(n.id)}
                          className="group flex w-full items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-left hover:border-white/15"
                        >
                          <Icon size={12} className="mt-[3px] text-amber-300" />
                          <div className="min-w-0">
                            <div className="truncate text-[12px] font-medium text-slate-100">
                              {n.name}
                            </div>
                            <div className="line-clamp-2 text-[10px] text-slate-400">
                              {n.shortExplanation}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>

        <Section title="Difficulty" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {difficulties.map((d) => (
              <Chip key={d} active={filters.difficulty.has(d)} tone="violet" onClick={() => toggleDifficulty(d)}>
                {d}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Layer" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {layers.map((l) => (
              <Chip key={l} active={filters.layer.has(l)} tone="emerald" onClick={() => toggleLayer(l)}>
                {l}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Relevance" defaultOpen={false}>
          <div className="space-y-2 text-[11px] text-slate-300">
            <div>
              <label className="flex items-center justify-between">
                <span>Min interview value</span>
                <span className="font-mono text-cyan-300">{filters.minInterview}</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={filters.minInterview}
                onChange={(e) => setMinInterview(parseInt(e.target.value, 10))}
                className="mt-1 w-full accent-cyan-400"
              />
            </div>
            <div>
              <label className="flex items-center justify-between">
                <span>Min production value</span>
                <span className="font-mono text-violet-300">{filters.minProduction}</span>
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={filters.minProduction}
                onChange={(e) => setMinProduction(parseInt(e.target.value, 10))}
                className="mt-1 w-full accent-violet-400"
              />
            </div>
          </div>
        </Section>
      </div>
    </GlassPanel>
  );
}
