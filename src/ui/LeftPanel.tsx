import { useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import type {
  Domain,
  Difficulty,
  Layer,
  LearningPath,
  ProjectIdea,
  Tradeoff,
  GNode,
} from '../data/schema';

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
  // Selecting from the navigator must focus the camera too — otherwise
  // clicking a domain row silently selects without moving the scene, which
  // reads as 'nothing happened'. App.tsx wraps store.select with the
  // camera-focus call; pass that wrapper in here.
  onPick: (id: string) => void;
}

const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

const difficulties: Difficulty[] = [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
];
const layers: Layer[] = [
  'conceptual',
  'architectural',
  'implementation',
  'operational',
  'optimization',
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
  onPick,
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
  const setShowOnlyUnconquered = useGraphStore(
    (s) => s.setShowOnlyUnconquered,
  );
  const clearConquered = useGraphStore((s) => s.clearConquered);
  const openQuiz = useGraphStore((s) => s.openQuiz);
  const userNotes = useGraphStore((s) => s.userNotes);
  const clearAllNotes = useGraphStore((s) => s.clearAllNotes);
  const replaceAllNotes = useGraphStore((s) => s.replaceAllNotes);

  const expandedDomainIds = useGraphStore((s) => s.expandedDomainIds);
  const expandedSubdomainIds = useGraphStore((s) => s.expandedSubdomainIds);
  const toggleDomainExpanded = useGraphStore((s) => s.toggleDomainExpanded);
  const toggleConquered = useGraphStore((s) => s.toggleConquered);
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

  // ─── derived stats ───
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

  const { done, total } = useMemo(() => {
    let d = 0;
    let t = 0;
    for (const n of allNodes) {
      if (n.kind === 'domain') continue;
      t++;
      if (conquered.has(n.id)) d++;
    }
    return { done: d, total: t };
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

  // Helpers for expand/collapse.
  const onExpandAll = () => {
    const subIds = allNodes
      .filter((n) => n.kind === 'subdomain')
      .map((n) => n.id);
    expandAll(domains.map((d) => d.id), subIds);
  };

  const isAllCollapsed =
    expandedDomainIds.size === 0 && expandedSubdomainIds.size === 0;

  return (
    <aside
      className={`pointer-events-auto absolute top-[64px] bottom-0 z-10
                  flex flex-col overflow-hidden font-sans
                  md:top-[92px] md:w-[300px]
                  ${mobileMenuOpen ? 'left-0 right-0 md:right-auto' : 'hidden md:flex'}
                  md:left-0`}
      style={{
        background: '#000',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div className="flex-1 overflow-y-auto px-8 py-9">
        <SectionHead n=".N1" label="NAVIGATOR" />

        {/* ── VIEW ─────────────────────────────────────────── */}
        <SectionHead n=".N2" label="VIEW" top={28} />
        <TextRow>
          <SerifLink onClick={onExpandAll}>Expand all</SerifLink>
          <Dot />
          <SerifLink muted={isAllCollapsed} onClick={collapseAll}>
            Collapse
          </SerifLink>
        </TextRow>

        {/* ── CONQUEST ─────────────────────────────────────── */}
        <SectionHead n=".N3" label="CONQUEST" top={28} active />
        <ConquestBlock done={done} total={total} />
        <TextRow top={12}>
          <Tag
            active={showOnlyConquered}
            onClick={() => setShowOnlyConquered(!showOnlyConquered)}
          >
            Show conquered
          </Tag>
          <Dot />
          <Tag
            active={showOnlyUnconquered}
            onClick={() => setShowOnlyUnconquered(!showOnlyUnconquered)}
          >
            Only unconquered
          </Tag>
        </TextRow>

        <DomainList
          domains={domains}
          allNodes={allNodes}
          stats={domainStats}
          activeFilterIds={filters.domainIds}
          expandedDomainIds={expandedDomainIds}
          conquered={conquered}
          onToggleFilter={toggleDomain}
          onToggleExpanded={toggleDomainExpanded}
          onToggleConquered={toggleConquered}
          onPick={onPick}
        />

        <button
          onClick={() => openQuiz(null)}
          className="mt-6 block w-full py-2 text-center font-mono uppercase transition-colors"
          style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: ACCENT,
            borderTop: `1px solid ${ACCENT_DIM}`,
            borderBottom: `1px solid ${ACCENT_DIM}`,
          }}
        >
          QUIZ ME →
        </button>

        {/* ── FILTERS ──────────────────────────────────────── */}
        <SectionHead n=".N4" label="FILTERS" top={28} />

        <Eyebrow top={12}>DIFFICULTY</Eyebrow>
        <TextRow>
          {difficulties.map((d, i) => (
            <span key={d}>
              <Tag
                active={filters.difficulty.has(d)}
                onClick={() => toggleDifficulty(d)}
              >
                {cap(d)}
              </Tag>
              {i < difficulties.length - 1 && <Dot />}
            </span>
          ))}
        </TextRow>

        <Eyebrow top={14}>LAYER</Eyebrow>
        <TextRow>
          {layers.map((l, i) => (
            <span key={l}>
              <Tag
                active={filters.layer.has(l)}
                onClick={() => toggleLayer(l)}
              >
                {cap(l)}
              </Tag>
              {i < layers.length - 1 && <Dot />}
            </span>
          ))}
        </TextRow>

        <Eyebrow top={14}>RELEVANCE</Eyebrow>
        <div className="mt-2 flex flex-col gap-2">
          <RelevanceLine
            label="Interview"
            value={filters.minInterview}
            onChange={setMinInterview}
          />
          <RelevanceLine
            label="Production"
            value={filters.minProduction}
            onChange={setMinProduction}
          />
        </div>

        {filtersActive && (
          <SerifLink
            muted
            className="mt-5 block"
            onClick={() => {
              resetFilters();
              setShowOnlyConquered(false);
              setShowOnlyUnconquered(false);
            }}
          >
            Reset filters
          </SerifLink>
        )}

        {conquered.size > 0 && (
          <SerifLink
            muted
            className="mt-1 block"
            onClick={clearConquered}
          >
            Reset conquest
          </SerifLink>
        )}

        {/* ── NOTES (personal annotations) ─────────────────── */}
        <SectionHead n=".N5" label="NOTES" top={28} />
        <NotesIO
          count={userNotes.size}
          onExport={() => downloadNotes(userNotes)}
          onImport={(entries) => replaceAllNotes(entries)}
          onClear={clearAllNotes}
        />

        {/* ── Mode-specific lists (conditional) ────────────── */}
        {mode === 'learning-path' && paths.length > 0 && (
          <ModeList
            n=".N5"
            label="PATHS"
            items={paths.map((p) => ({
              id: p.id,
              title: p.name,
              caption: p.description,
            }))}
            activeId={activePathId}
            onPick={(id) =>
              setActivePath(activePathId === id ? null : id)
            }
          />
        )}
        {mode === 'project' && projects.length > 0 && (
          <ModeList
            n=".N5"
            label="PROJECTS"
            items={projects.map((p) => ({
              id: p.id,
              title: p.name,
              caption: p.oneLiner,
            }))}
            activeId={activeProjectId}
            onPick={(id) =>
              setActiveProject(activeProjectId === id ? null : id)
            }
          />
        )}
        {mode === 'tradeoff' && tradeoffs.length > 0 && (
          <ModeList
            n=".N5"
            label="TRADEOFFS"
            items={tradeoffs.map((t) => ({
              id: t.id,
              title: t.name,
              caption: t.axis,
            }))}
            activeId={activeTradeoffId}
            onPick={(id) =>
              setActiveTradeoff(activeTradeoffId === id ? null : id)
            }
          />
        )}
        {(mode === 'failure-mode' ||
          mode === 'metric' ||
          mode === 'pattern' ||
          mode === 'tool') &&
          modeListNodes.length > 0 && (
            <ModeList
              n=".N5"
              label={
                mode === 'failure-mode'
                  ? 'FAILURES'
                  : mode === 'metric'
                  ? 'METRICS'
                  : mode === 'pattern'
                  ? 'PATTERNS'
                  : 'TOOLS'
              }
              items={modeListNodes.map((n) => ({
                id: n.id,
                title: n.name,
                caption: n.shortExplanation,
              }))}
              activeId={null}
              onPick={onPick}
            />
          )}
      </div>
    </aside>
  );
}

// ════════════ Inline subcomponents ═══════════════════════════════════════

function SectionHead({
  n,
  label,
  top = 0,
  active = false,
}: {
  n: string;
  label: string;
  top?: number;
  active?: boolean;
}) {
  return (
    <div
      className="flex items-baseline gap-2 pb-1.5"
      style={{
        marginTop: top,
        borderBottom: `1px solid ${active ? ACCENT_DIM : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: 8,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        {n}
      </span>
      <span
        className="font-mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.28em',
          color: active ? ACCENT : 'rgba(255,255,255,0.7)',
        }}
      >
        {label}
      </span>
      {active && (
        <span
          className="ml-auto"
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: ACCENT,
            boxShadow: `0 0 6px ${ACCENT}`,
            alignSelf: 'center',
          }}
        />
      )}
    </div>
  );
}

function Eyebrow({
  children,
  top = 0,
}: {
  children: ReactNode;
  top?: number;
}) {
  return (
    <div
      className="font-mono"
      style={{
        marginTop: top,
        marginBottom: 5,
        fontSize: 8,
        letterSpacing: '0.32em',
        color: 'rgba(255,255,255,0.42)',
      }}
    >
      {children}
    </div>
  );
}

function SerifLink({
  children,
  muted,
  onClick,
  className,
}: {
  children: ReactNode;
  muted?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-serif italic transition-colors ${className ?? ''}`}
      style={{
        fontSize: 13,
        letterSpacing: '0.01em',
        color: muted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = muted
          ? 'rgba(255,255,255,0.4)'
          : 'rgba(255,255,255,0.75)';
      }}
    >
      {children}
    </button>
  );
}

function Tag({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-sans uppercase whitespace-nowrap transition-colors"
      style={{
        fontSize: 10,
        letterSpacing: '0.16em',
        color: active ? ACCENT : 'rgba(255,255,255,0.55)',
        background: 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
      }}
    >
      {children}
    </button>
  );
}

function Dot() {
  return (
    <span
      style={{
        color: 'rgba(255,255,255,0.18)',
        margin: '0 7px',
      }}
    >
      ·
    </span>
  );
}

function TextRow({
  children,
  top = 8,
}: {
  children: ReactNode;
  top?: number;
}) {
  return (
    <div
      className="flex flex-wrap items-baseline"
      style={{ marginTop: top, fontSize: 13 }}
    >
      {children}
    </div>
  );
}

function ConquestBlock({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0;
  const pctText = total > 0 ? (pct * 100).toFixed(1) : '0.0';
  const fmt = (n: number) => String(n).padStart(3, '0');
  return (
    <div className="mt-3.5">
      <div
        className="flex items-baseline font-mono"
        style={{ fontSize: 26, letterSpacing: '0.06em' }}
      >
        <span style={{ color: ACCENT }}>{fmt(done)}</span>
        <span
          style={{
            color: 'rgba(255,255,255,0.22)',
            fontSize: 18,
            margin: '0 6px',
          }}
        >
          /
        </span>
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>{fmt(total)}</span>
      </div>
      <div
        className="mt-1 font-mono"
        style={{
          fontSize: 8,
          letterSpacing: '0.28em',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        NODES CONQUERED <span style={{ color: ACCENT }}>·</span> {pctText}%
      </div>
      <div
        className="relative mt-2.5"
        style={{
          height: 1,
          width: '100%',
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="absolute left-0 top-0 h-full transition-[width] duration-500"
          style={{
            width: `${pct * 100}%`,
            background: ACCENT,
            boxShadow: `0 0 6px ${ACCENT}`,
          }}
        />
      </div>
    </div>
  );
}

function DomainList({
  domains,
  allNodes,
  stats,
  activeFilterIds,
  expandedDomainIds,
  conquered,
  onToggleFilter,
  onToggleExpanded,
  onToggleConquered,
  onPick,
}: {
  domains: Domain[];
  allNodes: GNode[];
  stats: Map<string, { total: number; done: number }>;
  activeFilterIds: Set<string>;
  expandedDomainIds: Set<string>;
  conquered: Set<string>;
  onToggleFilter: (id: string) => void;
  onToggleExpanded: (id: string) => void;
  onToggleConquered: (id: string) => void;
  onPick: (id: string) => void;
}) {
  // Group subdomains by their parent domain id — computed once per render.
  // Subdomain children of each subdomain are summarised as 'n/m conquered'
  // so each subtopic row carries its own little progress signal.
  const subsByDomain = useMemo(() => {
    const m = new Map<string, GNode[]>();
    for (const n of allNodes) {
      if (n.kind !== 'subdomain') continue;
      const arr = m.get(n.domainId) ?? [];
      arr.push(n);
      m.set(n.domainId, arr);
    }
    return m;
  }, [allNodes]);

  const childCounts = useMemo(() => {
    // total + conquered descendants per subdomain id (concepts, patterns,
    // metrics, tools, failureModes that live under it).
    const totals = new Map<string, { total: number; done: number }>();
    for (const sub of allNodes) {
      if (sub.kind !== 'subdomain') continue;
      let total = 0;
      let done = 0;
      for (const n of allNodes) {
        if (n.kind === 'domain' || n.kind === 'subdomain') continue;
        // Walk one level up. If the parent is this subdomain, count it.
        if (n.parentId === sub.id) {
          total++;
          if (conquered.has(n.id)) done++;
          continue;
        }
        // Two levels deep — concept → subdomain.
        if (n.parentId) {
          const parent = allNodes.find((x) => x.id === n.parentId);
          if (parent && parent.parentId === sub.id) {
            total++;
            if (conquered.has(n.id)) done++;
          }
        }
      }
      totals.set(sub.id, { total, done });
    }
    return totals;
  }, [allNodes, conquered]);

  return (
    <div className="mt-6 flex flex-col gap-1.5">
      <div
        className="font-mono pb-1"
        style={{
          fontSize: 8,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.35)',
        }}
      >
        CLICK A DOMAIN TO ENTER →
      </div>
      {domains.map((d) => {
        const s = stats.get(d.id);
        const total = s?.total ?? 0;
        const done = s?.done ?? 0;
        const pct = total > 0 ? done / total : 0;
        const active = activeFilterIds.has(d.id);
        const hasDone = done > 0;
        const expanded = expandedDomainIds.has(d.id);
        const subs = subsByDomain.get(d.id) ?? [];

        const nameColor = active
          ? ACCENT
          : hasDone
          ? 'rgba(255,255,255,0.92)'
          : 'rgba(255,255,255,0.7)';
        const fracColor = hasDone
          ? ACCENT
          : 'rgba(255,255,255,0.32)';

        return (
          <div key={d.id} style={{ background: 'transparent' }}>
            <div className="group flex items-baseline gap-2 py-1">
              {/* Filter toggle — small dot on the left, hidden affordance */}
              <button
                type="button"
                onClick={() => onToggleFilter(d.id)}
                aria-label={`${active ? 'Clear' : 'Filter to'} ${d.name}`}
                title={active ? 'Clear filter' : 'Filter to this domain'}
                className="shrink-0 transition-colors"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: active ? ACCENT : 'transparent',
                  border: `1px solid ${active ? ACCENT : 'rgba(255,255,255,0.25)'}`,
                  cursor: 'pointer',
                  padding: 0,
                  alignSelf: 'center',
                }}
              />
              {/* Primary action — navigate to this domain */}
              <button
                type="button"
                onClick={() => onPick(d.id)}
                className="flex-1 text-left transition-colors"
                style={{
                  background: 'transparent',
                  cursor: 'pointer',
                  paddingRight: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="font-sans"
                    style={{
                      fontSize: 12,
                      fontWeight: 400,
                      letterSpacing: '0.01em',
                      color: nameColor,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {d.name}
                  </span>
                  <span
                    className="font-mono shrink-0"
                    style={{
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      color: fracColor,
                    }}
                  >
                    {String(done).padStart(2, '0')}/{String(total).padStart(2, '0')}
                  </span>
                </div>
                <div
                  className="mt-1"
                  style={{
                    height: 1,
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="h-full transition-[width] duration-300"
                    style={{
                      width: `${pct * 100}%`,
                      background: ACCENT,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </button>
              {/* Expand chevron — shows the subtopic list inline */}
              {subs.length > 0 && (
                <button
                  type="button"
                  onClick={() => onToggleExpanded(d.id)}
                  aria-label={
                    expanded
                      ? `Collapse ${d.name} subtopics`
                      : `Expand ${d.name} subtopics`
                  }
                  title={expanded ? 'Collapse' : 'Show subtopics'}
                  className="shrink-0 font-mono transition-colors"
                  style={{
                    fontSize: 10,
                    width: 14,
                    height: 14,
                    color: expanded
                      ? ACCENT
                      : 'rgba(255,255,255,0.4)',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    alignSelf: 'center',
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = expanded
                      ? ACCENT
                      : 'rgba(255,255,255,0.4)')
                  }
                >
                  {expanded ? '▾' : '▸'}
                </button>
              )}
            </div>

            {/* Subtopic dropdown */}
            {expanded && subs.length > 0 && (
              <div
                className="mb-2 mt-0.5 flex flex-col"
                style={{
                  paddingLeft: 13,
                  marginLeft: 2,
                  borderLeft: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {subs.map((sub) => {
                  const cc = childCounts.get(sub.id) ?? { total: 0, done: 0 };
                  const isConq = conquered.has(sub.id);
                  return (
                    <div
                      key={sub.id}
                      className="flex items-baseline gap-2 py-0.5"
                    >
                      {/* Tick checkbox */}
                      <button
                        type="button"
                        onClick={() => onToggleConquered(sub.id)}
                        aria-label={`${isConq ? 'Unmark' : 'Mark'} ${sub.name} as conquered`}
                        title={
                          isConq
                            ? 'Conquered — click to unmark'
                            : 'Mark as conquered'
                        }
                        className="shrink-0 font-mono transition-colors"
                        style={{
                          width: 12,
                          height: 12,
                          fontSize: 9,
                          lineHeight: 1,
                          textAlign: 'center',
                          color: isConq ? ACCENT : 'rgba(255,255,255,0.4)',
                          border: `1px solid ${
                            isConq ? ACCENT : 'rgba(255,255,255,0.18)'
                          }`,
                          background: isConq
                            ? 'rgba(94,234,183,0.08)'
                            : 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          alignSelf: 'center',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.borderColor = ACCENT)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.borderColor = isConq
                            ? ACCENT
                            : 'rgba(255,255,255,0.18)')
                        }
                      >
                        {isConq ? '✓' : ''}
                      </button>
                      {/* Name — clickable to navigate */}
                      <button
                        type="button"
                        onClick={() => onPick(sub.id)}
                        className="flex-1 text-left transition-colors"
                        style={{
                          fontSize: 11,
                          fontWeight: 400,
                          letterSpacing: '0.01em',
                          color: isConq
                            ? 'rgba(255,255,255,0.55)'
                            : 'rgba(255,255,255,0.82)',
                          textDecoration: isConq ? 'line-through' : 'none',
                          textDecorationColor: ACCENT_DIM,
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: '1px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = '#fff')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = isConq
                            ? 'rgba(255,255,255,0.55)'
                            : 'rgba(255,255,255,0.82)')
                        }
                      >
                        {sub.name}
                      </button>
                      {cc.total > 0 && (
                        <span
                          className="font-mono shrink-0"
                          style={{
                            fontSize: 8,
                            letterSpacing: '0.08em',
                            color:
                              cc.done > 0
                                ? ACCENT_DIM
                                : 'rgba(255,255,255,0.25)',
                          }}
                        >
                          {cc.done}/{cc.total}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RelevanceLine({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="font-serif italic"
        style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
          flex: 1,
        }}
      >
        {label}
      </span>
      <div className="flex gap-[2px]">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i === value ? 1 : i)}
            aria-label={`${label} ≥ ${i}`}
            style={{
              width: 8,
              height: 2,
              background:
                i <= value ? ACCENT : 'rgba(255,255,255,0.12)',
              display: 'block',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
            }}
          />
        ))}
      </div>
      <span
        className="font-mono text-right"
        style={{
          fontSize: 9,
          letterSpacing: '0.12em',
          color: ACCENT,
          width: 18,
        }}
      >
        {value}+
      </span>
    </div>
  );
}

interface ModeListItem {
  id: string;
  title: string;
  caption?: string;
}

function ModeList({
  n,
  label,
  items,
  activeId,
  onPick,
}: {
  n: string;
  label: string;
  items: ModeListItem[];
  activeId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <SectionHead n={n} label={label} top={28} />
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((it) => {
          const isActive = it.id === activeId;
          const itemStyle: CSSProperties = {
            background: 'transparent',
            borderLeft: `1px solid ${isActive ? ACCENT : 'rgba(255,255,255,0.06)'}`,
            paddingLeft: 10,
            cursor: 'pointer',
          };
          return (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onPick(it.id)}
                className="block w-full py-1 text-left"
                style={itemStyle}
              >
                <div
                  className="font-serif italic"
                  style={{
                    fontSize: 13,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.78)',
                    letterSpacing: '0.01em',
                  }}
                >
                  {it.title}
                </div>
                {it.caption && (
                  <div
                    className="font-mono"
                    style={{
                      marginTop: 2,
                      fontSize: 9,
                      letterSpacing: '0.06em',
                      color: 'rgba(255,255,255,0.4)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {it.caption}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ── Notes export / import ───────────────────────────────────────────────
function downloadNotes(notes: Map<string, string>) {
  const obj: Record<string, string> = {};
  for (const [k, v] of notes) obj[k] = v;
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  a.href = url;
  a.download = `godview-notes-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function NotesIO({
  count,
  onExport,
  onImport,
  onClear,
}: {
  count: number;
  onExport: () => void;
  onImport: (entries: Record<string, string>) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const triggerImport = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setImportMsg('Invalid file');
        return;
      }
      const entries: Record<string, string> = {};
      let n = 0;
      for (const k of Object.keys(parsed)) {
        if (typeof parsed[k] === 'string' && parsed[k].trim()) {
          entries[k] = parsed[k];
          n++;
        }
      }
      onImport(entries);
      setImportMsg(`Imported ${n} notes`);
      setTimeout(() => setImportMsg(null), 2400);
    } catch {
      setImportMsg('Could not read file');
      setTimeout(() => setImportMsg(null), 2400);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div
        className="font-mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        <span style={{ color: 'var(--mint)' }}>
          {String(count).padStart(2, '0')}
        </span>{' '}
        / SAVED LOCALLY
      </div>
      <TextRow top={2}>
        <SerifLink onClick={onExport} muted={count === 0}>
          Export →
        </SerifLink>
        <Dot />
        <SerifLink onClick={triggerImport}>Import</SerifLink>
        {count > 0 && (
          <>
            <Dot />
            <SerifLink muted onClick={onClear}>
              Reset
            </SerifLink>
          </>
        )}
      </TextRow>
      {importMsg && (
        <div
          className="font-mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.16em',
            color: 'var(--mint)',
          }}
        >
          {importMsg}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={onFile}
      />
    </div>
  );
}
