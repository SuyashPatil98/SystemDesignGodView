import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGraphStore, type OverrideField } from '../store/useGraphStore';
import { shareableUrl } from '../lib/urlState';
import { googleFallback } from '../data/resources';
import { getClusters } from '../three/layout';
import type { GNode, Domain, ResourceLink } from '../data/schema';

interface Props {
  nodes: Map<string, GNode>;
  domains: Map<string, Domain>;
  breadcrumbs: GNode[]; // root → … → selected
  onSelect: (id: string) => void;
}

const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

const CLUSTER_LABEL: Record<string, string> = {
  foundations: 'FOUNDATIONS',
  storage: 'STORAGE & MESSAGING',
  'devops-cloud': 'DEVOPS & CLOUD',
  data: 'DATA',
  ml: 'MACHINE LEARNING',
  genai: 'GENAI & PRODUCTION AI',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function NodeDetailOverlay({
  nodes,
  domains,
  breadcrumbs,
  onSelect,
}: Props) {
  const selectedId = useGraphStore((s) => s.selectedId);
  const conquered = useGraphStore((s) => s.conquered);
  const navigatorCollapsed = useGraphStore((s) => s.navigatorCollapsed);
  const toggleConquered = useGraphStore((s) => s.toggleConquered);
  const focusedSubtreeId = useGraphStore((s) => s.focusedSubtreeId);
  const setFocusedSubtree = useGraphStore((s) => s.setFocusedSubtree);
  const compareA = useGraphStore((s) => s.compareA);
  const compareB = useGraphStore((s) => s.compareB);
  const addToCompare = useGraphStore((s) => s.addToCompare);
  const select = useGraphStore((s) => s.select);
  const mode = useGraphStore((s) => s.mode);
  const activePathId = useGraphStore((s) => s.activePathId);

  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const node = selectedId ? nodes.get(selectedId) ?? null : null;

  // Reset transient UI when the selection changes.
  useEffect(() => {
    setCopied(false);
    setMoreOpen(false);
  }, [selectedId]);

  // ── Cluster + region metadata ───────────────────────────────────────────
  const clusterInfo = useMemo(() => {
    if (!node) return null;
    const clusters = getClusters();
    const idx = clusters.findIndex((c) => c.domainIds.includes(node.domainId));
    if (idx < 0) return null;
    return {
      number: `.0${idx + 1}`,
      label: CLUSTER_LABEL[clusters[idx].id] ?? clusters[idx].name.toUpperCase(),
    };
  }, [node]);

  const domain = node ? domains.get(node.domainId) ?? null : null;

  // Position among siblings — gives the decorative ".02 / 06"
  const positionLabel = useMemo(() => {
    if (!node || !node.parentId) return null;
    const sibs: GNode[] = [];
    for (const n of nodes.values()) {
      if (n.parentId === node.parentId) sibs.push(n);
    }
    const ix = sibs.findIndex((s) => s.id === node.id);
    if (ix < 0) return null;
    return `.${String(ix + 1).padStart(2, '0')} / ${String(sibs.length).padStart(2, '0')}`;
  }, [node, nodes]);

  // Parent path for the top-right breadcrumb (DOMAIN · SUBDOMAIN)
  const parentChain = useMemo(() => {
    if (breadcrumbs.length < 2) return null;
    // Everything except the leaf (= selected).
    return breadcrumbs.slice(0, -1).map((n) => n.name.toUpperCase()).join(' · ');
  }, [breadcrumbs]);

  // ── Resources (curated + Google fallback) ──────────────────────────────
  const resources: ResourceLink[] = useMemo(() => {
    if (!node) return [];
    return [
      ...(node.resources ?? []),
      googleFallback(node.name, domain?.name),
    ];
  }, [node, domain]);

  // ── Related concepts ───────────────────────────────────────────────────
  const related = useMemo(() => {
    if (!node) return [];
    const out: GNode[] = [];
    for (const id of node.relatedIds ?? []) {
      const r = nodes.get(id);
      if (r) out.push(r);
    }
    return out;
  }, [node, nodes]);

  // ── Secondary content presence count for "+ N MORE" ────────────────────
  const secondaryCount = useMemo(() => {
    if (!node) return 0;
    let n = 0;
    if (node.problemSolved) n++;
    if ((node.whereItAppears ?? []).length) n++;
    if ((node.useCases ?? []).length) n++;
    if ((node.commonMistakes ?? []).length) n++;
    if ((node.designQuestions ?? []).length) n++;
    if (node.interviewFraming) n++;
    if (node.productionFraming) n++;
    if ((node.toolIds ?? []).length) n++;
    if (resources.length > 0) n++; // always at least the Google fallback
    if ((node.tags ?? []).length) n++;
    return n;
  }, [node, resources]);

  if (!node) return null;

  // ── Action handlers ────────────────────────────────────────────────────
  const isConq = conquered.has(node.id);
  const isFocused = focusedSubtreeId === node.id;
  const isCompare = compareA === node.id || compareB === node.id;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        shareableUrl({ selectedId: node.id, mode, activePathId }),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  // ── Callout rows (the canonical 5) ─────────────────────────────────────
  // Each row carries the canonical body (from src/data) AND its override
  // field key. The Callout component reads the override layer at render
  // time, so the user's edits replace the canonical text without touching
  // the source data.
  const callouts: {
    n: string;
    kind: string;
    field: OverrideField;
    body: string | undefined;
  }[] = [
    { n: '.01', kind: 'WHY IT MATTERS', field: 'whyItMatters', body: node.whyItMatters },
    { n: '.02', kind: 'MENTAL MODEL', field: 'mentalModel', body: node.mentalModel },
    {
      n: '.03',
      kind: 'TRADEOFF',
      field: 'tradeoffs',
      body: node.tradeoffs && node.tradeoffs.length > 0 ? node.tradeoffs.join(' · ') : undefined,
    },
    {
      n: '.04',
      kind: 'FAILS AS',
      field: 'failureModes',
      body:
        node.failureModes && node.failureModes.length > 0
          ? node.failureModes.join(' · ')
          : undefined,
    },
    {
      n: '.05',
      kind: 'WATCH',
      field: 'metricsToMonitor',
      body:
        node.metricsToMonitor && node.metricsToMonitor.length > 0
          ? node.metricsToMonitor.join(' · ')
          : undefined,
    },
  ];

  return (
    <div
      key={node.id}
      className="pointer-events-none fixed inset-0 z-30 select-none animate-fade-in"
      style={{ animation: 'overlay-fade 220ms ease-out' }}
    >
      {/* Local CSS: keyframes for orbit ring + fade-in, plus mobile
          layout overrides so the title hugs the edge instead of being
          pushed past the (hidden-on-mobile) navigator. */}
      <style>{`
        @keyframes orbit-cw  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orbit-ccw { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes overlay-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 767px) {
          .ndo-left  { left: 20px !important; top: 88px !important; max-width: calc(100vw - 40px) !important; }
          .ndo-rel   { left: 20px !important; max-width: calc(100vw - 40px) !important; bottom: 24px !important; }
          .ndo-stack { top: 360px !important; bottom: 24px !important; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>

      {/* Mobile-only backdrop blur — softens the galaxy behind the
          overlay so the content reads cleanly on a small screen. The
          desktop layout has dedicated columns and doesn't need it. */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          background: 'rgba(0,0,0,0.35)',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* OrbitRing — two counter-rotating groups, centered */}
      <OrbitRing />

      {/* Top-right breadcrumb */}
      <div
        className="pointer-events-auto absolute right-12 top-[112px] z-10 hidden md:block text-right"
        style={{ maxWidth: 360 }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.36)',
          }}
        >
          {clusterInfo && (
            <>
              {clusterInfo.label}{' '}
              <span style={{ color: ACCENT }}>{clusterInfo.number}</span>
            </>
          )}
          {clusterInfo && parentChain && (
            <span style={{ color: 'rgba(255,255,255,0.2)' }}> · </span>
          )}
          {parentChain}
        </div>
        <div
          className="mt-2 font-serif italic"
          style={{
            fontSize: 13,
            letterSpacing: '0.02em',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {cap(node.kind)} · {cap(node.layer)}
        </div>
      </div>

      {/* Mobile close — always-visible × at the top-right corner. The
          desktop ESC pill at the bottom-right covers the same job but
          is hidden on small screens, leaving the user with no way out. */}
      <button
        type="button"
        onClick={() => select(null)}
        aria-label="Close"
        className="pointer-events-auto absolute z-20 md:hidden flex items-center justify-center"
        style={{
          top: 12,
          right: 12,
          width: 38,
          height: 38,
          fontSize: 18,
          lineHeight: 1,
          color: '#fff',
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid var(--mint-dim)',
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      {/* Left column — title block. Normally anchored past the 300px
          navigator on desktop; when the user collapses the navigator,
          it shifts back to the edge. On mobile a media-query override
          (.ndo-left) snaps it to the left margin regardless. */}
      <div
        className="ndo-left pointer-events-auto absolute z-10 px-6 md:px-0"
        style={{
          left: navigatorCollapsed
            ? 'clamp(24px, 4vw, 64px)'
            : 'clamp(24px, 24vw, 340px)',
          top: '34%',
          maxWidth: 500,
        }}
      >
        {positionLabel && (
          <div
            className="font-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.28em',
              color: ACCENT,
              marginBottom: 16,
            }}
          >
            {positionLabel}
          </div>
        )}

        <div
          className="font-serif text-white"
          style={{
            fontSize: 'clamp(36px, 5.4vw, 62px)',
            lineHeight: 0.95,
            letterSpacing: '0.005em',
            textShadow: `0 0 28px ${ACCENT_DIM}`,
          }}
        >
          {node.name}
        </div>

        {(clusterInfo || domain) && (
          <div
            className="mt-4 font-sans uppercase"
            style={{
              fontSize: 10,
              fontWeight: 300,
              letterSpacing: '0.26em',
              color: ACCENT,
              opacity: 0.85,
            }}
          >
            {clusterInfo?.label.split(' & ')[0]} · {domain?.name.toUpperCase()}
          </div>
        )}

        <div
          className="mt-5 font-serif italic"
          style={{
            fontSize: 17,
            lineHeight: 1.42,
            color: 'rgba(255,255,255,0.78)',
            maxWidth: 420,
          }}
        >
          {node.shortExplanation}
        </div>

        {/* Action row */}
        <div className="mt-7 flex flex-wrap gap-2.5">
          <ActionButton
            primary={!isConq}
            label={isConq ? '✓ CONQUERED' : 'CONQUER'}
            onClick={() => toggleConquered(node.id)}
          />
          <ActionButton
            primary={isFocused}
            label={isFocused ? '◯ ISOLATED' : 'ISOLATE'}
            onClick={() => setFocusedSubtree(isFocused ? null : node.id)}
          />
          <ActionButton
            primary={isCompare}
            label={isCompare ? 'COMPARING' : 'COMPARE'}
            onClick={() => addToCompare(node.id)}
          />
          <ActionButton
            primary={copied}
            label={copied ? 'COPIED' : 'COPY LINK'}
            onClick={onCopy}
          />
        </div>
      </div>

      {/* Right column — personal note + 5 callouts */}
      <div
        className="pointer-events-auto absolute right-12 z-10 hidden md:flex flex-col gap-7"
        style={{ top: 200, maxWidth: 232 }}
      >
        <MyNotesEditor nodeId={node.id} />
        {callouts.map((c) => (
          <Callout
            key={c.n}
            n={c.n}
            kind={c.kind}
            body={c.body}
            nodeId={node.id}
            field={c.field}
          />
        ))}

        {secondaryCount > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="self-start font-mono uppercase transition-colors"
            style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              color: ACCENT_DIM,
              cursor: 'pointer',
              background: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT_DIM)}
          >
            {moreOpen ? '× HIDE NOTES' : `+ ${secondaryCount} MORE →`}
          </button>
        )}
      </div>

      {/* Mobile stacked layout — callouts under the headline. The
          .ndo-stack media-query override pulls this up to land just
          below the action buttons and makes it scrollable so all 5
          callouts + notes are reachable. */}
      <div
        className="ndo-stack pointer-events-auto absolute inset-x-5 z-10 mt-4 flex flex-col gap-6 md:hidden"
        style={{ top: 'calc(34% + 320px)', bottom: 120 }}
      >
        <MyNotesEditor nodeId={node.id} />
        {callouts.map((c) => (
          <Callout
            key={c.n}
            n={c.n}
            kind={c.kind}
            body={c.body}
            nodeId={node.id}
            field={c.field}
          />
        ))}
        {secondaryCount > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="self-start font-mono uppercase"
            style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              color: ACCENT_DIM,
              background: 'transparent',
            }}
          >
            {moreOpen ? '× HIDE NOTES' : `+ ${secondaryCount} MORE →`}
          </button>
        )}
      </div>

      {/* Bottom-left: related */}
      {related.length > 0 && (
        <div
          className="ndo-rel pointer-events-auto absolute z-10 hidden md:block"
          style={{
            left: navigatorCollapsed
              ? 'clamp(24px, 4vw, 64px)'
              : 'clamp(24px, 24vw, 340px)',
            bottom: 36,
            maxWidth: 'min(560px, 60vw)',
          }}
        >
          <div
            className="font-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.22em',
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 10,
            }}
          >
            RELATED <span style={{ color: ACCENT_DIM }}>·</span> {related.length}
          </div>
          <div className="flex flex-wrap items-baseline" style={{ gap: '0 16px' }}>
            {related.map((r, i) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id)}
                className="font-serif italic transition-colors"
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.55)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')
                }
              >
                {r.name}
                {i < related.length - 1 && (
                  <span style={{ marginLeft: 16, color: 'rgba(255,255,255,0.2)' }}>·</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom-right: ESC hint */}
      <div
        className="pointer-events-auto absolute z-10 right-12 bottom-9 hidden md:flex items-center font-mono"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.32)',
        }}
      >
        <button
          type="button"
          onClick={() => select(null)}
          style={{
            color: ACCENT,
            border: `1px solid ${ACCENT_DIM}`,
            padding: '2px 6px',
            marginRight: 8,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          ESC
        </button>
        BACK TO ATLAS
      </div>

      {/* Notes drawer (secondary fields) */}
      {moreOpen && (
        <NotesDrawer
          node={node}
          resources={resources}
          nodes={nodes}
          onClose={() => setMoreOpen(false)}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

// ════════════ Inline subcomponents ═══════════════════════════════════════

function OrbitRing() {
  return (
    <svg
      viewBox="-200 -200 400 400"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(540px, 80vmin)',
        height: 'min(540px, 80vmin)',
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      {/* Outer group — clockwise */}
      <g
        style={{
          animation: 'orbit-cw 60s linear infinite',
          transformOrigin: 'center',
        }}
      >
        <circle
          cx="0"
          cy="0"
          r="178"
          fill="none"
          stroke={ACCENT_DIM}
          strokeWidth="0.5"
          strokeDasharray="1 4"
        />
        {[
          [0, -188, 0, -168],
          [188, 0, 168, 0],
          [-132, -132, -120, -120],
          [132, 132, 120, 120],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ACCENT}
            strokeWidth="0.8"
            opacity="0.75"
          />
        ))}
      </g>

      {/* Inner group — counter-clockwise */}
      <g
        style={{
          animation: 'orbit-ccw 90s linear infinite',
          transformOrigin: 'center',
        }}
      >
        <circle
          cx="0"
          cy="0"
          r="92"
          fill="none"
          stroke={ACCENT_DIM}
          strokeWidth="0.7"
          opacity="0.55"
        />
        <circle
          cx="0"
          cy="0"
          r="140"
          fill="none"
          stroke={ACCENT_DIM}
          strokeWidth="0.5"
          strokeDasharray="1 4"
        />
        {[
          [0, 188, 0, 168],
          [-188, 0, -168, 0],
          [-132, 132, -120, 120],
          [132, -132, 120, -120],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={ACCENT}
            strokeWidth="0.8"
            opacity="0.75"
          />
        ))}
      </g>
    </svg>
  );
}

function Callout({
  n,
  kind,
  body,
  nodeId,
  field,
}: {
  n: string;
  kind: string;
  body?: string;
  nodeId: string;
  field: OverrideField;
}) {
  const override = useGraphStore((s) => s.overrides.get(nodeId)?.[field]);
  const setOverride = useGraphStore((s) => s.setOverride);
  const clearOverride = useGraphStore((s) => s.clearOverride);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Close editor whenever the node changes — selecting a different node
  // shouldn't carry over a half-typed override.
  useEffect(() => {
    setEditing(false);
    setDraft('');
  }, [nodeId, field]);

  const effective = override ?? body;
  const isOverridden = override !== undefined;

  const startEdit = () => {
    setDraft(effective ?? '');
    setEditing(true);
  };
  const save = () => {
    setOverride(nodeId, field, draft);
    setEditing(false);
  };
  const cancel = () => {
    setEditing(false);
    setDraft('');
  };
  const revert = () => {
    clearOverride(nodeId, field);
    setEditing(false);
    setDraft('');
  };

  return (
    <div style={{ width: 232 }}>
      <div
        className="flex items-baseline gap-2 font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: ACCENT,
          marginBottom: 6,
        }}
      >
        <span style={{ color: ACCENT_DIM }}>{n}</span>
        <span>{kind}</span>
        {isOverridden && !editing && (
          <span
            title="Edited by you — click to revert"
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: ACCENT,
              boxShadow: `0 0 6px ${ACCENT}`,
              marginLeft: 2,
              alignSelf: 'center',
            }}
          />
        )}
        {!editing && (
          <span className="ml-auto flex items-baseline gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="font-mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                color: ACCENT_DIM,
                background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT_DIM)}
            >
              {effective ? 'EDIT' : '+ ADD'}
            </button>
            {isOverridden && (
              <button
                type="button"
                onClick={revert}
                className="font-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.35)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')
                }
                title="Discard your edit and restore the documented text"
              >
                REVERT
              </button>
            )}
          </span>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
              else if (e.key === 'Escape') {
                e.stopPropagation();
                cancel();
              }
            }}
            placeholder={`Write your own ${kind.toLowerCase()}.`}
            className="font-sans bg-transparent outline-none resize-vertical placeholder:text-white/30"
            style={{
              fontWeight: 300,
              fontSize: 11,
              lineHeight: 1.5,
              minHeight: 72,
              padding: '6px 8px',
              border: `1px solid ${ACCENT_DIM}`,
              background: 'rgba(94,234,183,0.04)',
              color: 'rgba(255,255,255,0.92)',
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                padding: '4px 8px',
                color: ACCENT,
                border: `1px solid ${ACCENT}`,
                background: 'rgba(94,234,183,0.08)',
                cursor: 'pointer',
              }}
            >
              SAVE
            </button>
            <button
              type="button"
              onClick={cancel}
              className="font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                padding: '4px 8px',
                color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
            <span
              className="font-mono ml-auto self-center"
              style={{
                fontSize: 8,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              ⌘↵ · ESC
            </span>
          </div>
        </div>
      ) : (
        <div
          className="font-sans"
          style={{
            fontWeight: 300,
            fontSize: 11,
            lineHeight: 1.5,
            color: effective ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)',
            fontStyle: effective ? 'normal' : 'italic',
            paddingLeft: isOverridden ? 8 : 0,
            borderLeft: isOverridden
              ? `1px solid ${ACCENT_DIM}`
              : 'none',
            whiteSpace: 'pre-wrap',
          }}
        >
          {effective ?? '— not documented —'}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono uppercase transition-colors"
      style={{
        fontSize: 9,
        letterSpacing: '0.22em',
        padding: '7px 11px',
        border: `1px solid ${primary ? ACCENT : 'rgba(255,255,255,0.18)'}`,
        color: primary ? ACCENT : 'rgba(255,255,255,0.6)',
        background: primary ? `${ACCENT}10` : 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        if (!primary) e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={(e) => {
        if (!primary) e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
      }}
    >
      {label}
    </button>
  );
}

// ── Notes drawer ─────────────────────────────────────────────────────────
function NotesDrawer({
  node,
  resources,
  nodes,
  onClose,
  onSelect,
}: {
  node: GNode;
  resources: ResourceLink[];
  nodes: Map<string, GNode>;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const sections: { n: string; label: string; render: () => ReactNode }[] = [];
  let i = 1;

  if (node.problemSolved) {
    sections.push({
      n: `.N${i++}`,
      label: 'PROBLEM SOLVED',
      render: () => <Para>{node.problemSolved!}</Para>,
    });
  }
  if (node.whereItAppears && node.whereItAppears.length) {
    sections.push({
      n: `.N${i++}`,
      label: 'WHERE IT APPEARS',
      render: () => <List items={node.whereItAppears!} />,
    });
  }
  if (node.useCases && node.useCases.length) {
    sections.push({
      n: `.N${i++}`,
      label: 'USE CASES',
      render: () => <List items={node.useCases!} />,
    });
  }
  if (node.commonMistakes && node.commonMistakes.length) {
    sections.push({
      n: `.N${i++}`,
      label: 'COMMON MISTAKES',
      render: () => <List items={node.commonMistakes!} />,
    });
  }
  if (node.designQuestions && node.designQuestions.length) {
    sections.push({
      n: `.N${i++}`,
      label: 'DESIGN QUESTIONS',
      render: () => <List items={node.designQuestions!} italic />,
    });
  }
  if (node.interviewFraming) {
    sections.push({
      n: `.N${i++}`,
      label: 'INTERVIEW FRAMING',
      render: () => <Para>{node.interviewFraming!}</Para>,
    });
  }
  if (node.productionFraming) {
    sections.push({
      n: `.N${i++}`,
      label: 'PRODUCTION FRAMING',
      render: () => <Para>{node.productionFraming!}</Para>,
    });
  }
  if (node.toolIds && node.toolIds.length) {
    sections.push({
      n: `.N${i++}`,
      label: 'TOOLS',
      render: () => (
        <div className="flex flex-wrap" style={{ gap: '4px 12px' }}>
          {node.toolIds!.map((tid) => {
            const t = nodes.get(tid);
            if (!t) return null;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => onSelect(tid)}
                className="font-serif italic"
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.7)',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      ),
    });
  }
  if (resources.length > 0) {
    sections.push({
      n: `.N${i++}`,
      label: 'RESOURCES',
      render: () => (
        <ul className="flex flex-col" style={{ gap: 6 }}>
          {resources.map((r, idx) => (
            <li key={idx}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-baseline gap-2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')
                }
              >
                <span
                  className="font-mono uppercase"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    color: ACCENT,
                  }}
                >
                  {r.kind}
                </span>
                <span className="font-serif italic" style={{ fontSize: 13 }}>
                  {r.label}
                </span>
                <span style={{ color: ACCENT, fontSize: 10 }}>↗</span>
              </a>
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (node.tags && node.tags.length) {
    sections.push({
      n: `.N${i++}`,
      label: 'TAGS',
      render: () => (
        <div className="flex flex-wrap" style={{ gap: '4px 10px' }}>
          {node.tags!.map((t) => (
            <span
              key={t}
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.04em',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      ),
    });
  }

  return (
    <div
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[60vh] overflow-y-auto px-6 pt-6 pb-12 md:px-12"
      style={{
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,1) 30%)',
        borderTop: `1px solid ${ACCENT_DIM}`,
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.28em',
            color: ACCENT,
          }}
        >
          NOTES <span style={{ color: ACCENT_DIM }}>·</span> {sections.length} sections
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.5)',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')
          }
        >
          × CLOSE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '32px 56px' }}>
        {sections.map((s) => (
          <div key={s.n}>
            <div
              className="flex items-baseline gap-2 pb-1.5"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.07)',
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
                {s.n}
              </span>
              <span
                className="font-mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.28em',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {s.label}
              </span>
            </div>
            <div className="mt-3">{s.render()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Para({ children }: { children: ReactNode }) {
  return (
    <p
      className="font-sans"
      style={{
        fontSize: 12,
        fontWeight: 300,
        lineHeight: 1.55,
        color: 'rgba(255,255,255,0.78)',
      }}
    >
      {children}
    </p>
  );
}

function MyNotesEditor({ nodeId }: { nodeId: string }) {
  const note = useGraphStore((s) => s.userNotes.get(nodeId));
  const setNote = useGraphStore((s) => s.setNote);
  const clearNote = useGraphStore((s) => s.clearNote);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Close editor whenever a different node is opened.
  useEffect(() => {
    setEditing(false);
    setDraft('');
  }, [nodeId]);

  const startEdit = () => {
    setDraft(note ?? '');
    setEditing(true);
  };

  const save = () => {
    setNote(nodeId, draft);
    setEditing(false);
  };

  const cancel = () => {
    setEditing(false);
    setDraft('');
  };

  // Empty state — invite a first note.
  if (!note && !editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        className="self-start font-mono uppercase transition-colors"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: ACCENT_DIM,
          background: 'transparent',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
        onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT_DIM)}
      >
        + ADD A NOTE
      </button>
    );
  }

  return (
    <div style={{ width: 232 }}>
      <div
        className="flex items-baseline justify-between gap-2 font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: ACCENT,
          marginBottom: 6,
        }}
      >
        <span>
          <span style={{ color: ACCENT_DIM }}>.N0</span> MY NOTES
        </span>
        {!editing && (
          <span className="flex items-center gap-3">
            <button
              type="button"
              onClick={startEdit}
              className="font-mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                color: ACCENT,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              EDIT
            </button>
            <button
              type="button"
              onClick={() => clearNote(nodeId)}
              className="font-mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.4)',
                background: 'transparent',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fb7185')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')
              }
            >
              CLEAR
            </button>
          </span>
        )}
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save();
              else if (e.key === 'Escape') {
                e.stopPropagation(); // don't bubble to App.tsx's Esc handler
                cancel();
              }
            }}
            placeholder="Your own words, in your own language."
            className="font-serif italic bg-transparent outline-none resize-vertical text-white placeholder:text-white/30"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              minHeight: 88,
              padding: '8px 10px',
              border: `1px solid ${ACCENT_DIM}`,
              background: 'rgba(94,234,183,0.04)',
              color: 'rgba(255,255,255,0.92)',
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                padding: '5px 10px',
                color: ACCENT,
                border: `1px solid ${ACCENT}`,
                background: 'rgba(94,234,183,0.08)',
                cursor: 'pointer',
              }}
            >
              SAVE
            </button>
            <button
              type="button"
              onClick={cancel}
              className="font-mono uppercase"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                padding: '5px 10px',
                color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              CANCEL
            </button>
            <span
              className="font-mono ml-auto self-center"
              style={{
                fontSize: 8,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              ⌘↵ SAVE · ESC CANCEL
            </span>
          </div>
        </div>
      ) : (
        <div
          className="font-serif italic"
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.92)',
            paddingLeft: 10,
            borderLeft: `1px solid ${ACCENT}`,
            whiteSpace: 'pre-wrap',
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

function List({ items, italic = false }: { items: string[]; italic?: boolean }) {
  return (
    <ul className="flex flex-col" style={{ gap: 6 }}>
      {items.map((it, i) => (
        <li
          key={i}
          className={italic ? 'font-serif italic' : 'font-sans'}
          style={{
            fontSize: italic ? 13 : 12,
            fontWeight: italic ? 400 : 300,
            lineHeight: 1.5,
            color: 'rgba(255,255,255,0.75)',
            paddingLeft: 12,
            position: 'relative',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 0,
              color: ACCENT_DIM,
            }}
          >
            ·
          </span>
          {it}
        </li>
      ))}
    </ul>
  );
}
