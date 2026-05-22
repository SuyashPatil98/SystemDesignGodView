import { useEffect, useState } from 'react';
import { X, GitCompare } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode } from '../data/schema';

interface Props {
  nodes: Map<string, GNode>;
  onSelect: (id: string) => void;
}

interface Row {
  label: string;
  pick: (n: GNode) => string | string[] | number | undefined;
}

const ROWS: Row[] = [
  { label: 'Kind', pick: (n) => n.kind },
  { label: 'Domain', pick: (n) => n.domainId },
  { label: 'Difficulty', pick: (n) => n.difficulty },
  { label: 'Layer', pick: (n) => n.layer },
  { label: 'Short explanation', pick: (n) => n.shortExplanation },
  { label: 'Why it matters', pick: (n) => n.whyItMatters },
  { label: 'Mental model', pick: (n) => n.mentalModel },
  { label: 'Use cases', pick: (n) => n.useCases },
  { label: 'Tradeoffs', pick: (n) => n.tradeoffs },
  { label: 'Failure modes', pick: (n) => n.failureModes },
  { label: 'Metrics to monitor', pick: (n) => n.metricsToMonitor },
  { label: 'Interview framing', pick: (n) => n.interviewFraming },
  { label: 'Production framing', pick: (n) => n.productionFraming },
  { label: 'Tags', pick: (n) => n.tags },
];

const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

function renderValue(val: string | string[] | number | undefined) {
  if (val == null)
    return <span className="text-white/30 italic font-serif">—</span>;
  if (Array.isArray(val)) {
    if (val.length === 0)
      return <span className="text-white/30 italic font-serif">—</span>;
    return (
      <ul className="space-y-1">
        {val.map((v, i) => (
          <li
            key={i}
            className="list-disc pl-3 text-white/80"
            style={{ fontSize: 12, lineHeight: 1.5 }}
          >
            {v}
          </li>
        ))}
      </ul>
    );
  }
  return <span>{String(val)}</span>;
}

export default function ComparePanel({ nodes, onSelect }: Props) {
  const compareA = useGraphStore((s) => s.compareA);
  const compareB = useGraphStore((s) => s.compareB);
  const compareOpen = useGraphStore((s) => s.compareOpen);
  const setCompareOpen = useGraphStore((s) => s.setCompareOpen);
  const clearCompare = useGraphStore((s) => s.clearCompare);

  const a = compareA ? nodes.get(compareA) ?? null : null;
  const b = compareB ? nodes.get(compareB) ?? null : null;
  const show = compareOpen && !!a && !!b;

  // Fade-in/out: mount immediately, but lerp opacity via a brief CSS class.
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [show, mounted]);

  if (!mounted || !a || !b) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8"
      style={{
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 200ms ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setCompareOpen(false);
      }}
    >
      <div
        className="flex h-full max-h-[88vh] w-full max-w-[1100px] flex-col bg-black"
        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="flex items-center gap-2 font-mono uppercase"
            style={{
              fontSize: 10,
              letterSpacing: '0.28em',
              color: ACCENT,
            }}
          >
            <GitCompare size={12} />
            Compare
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => clearCompare()}
              className="font-mono uppercase transition-colors"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                color: 'rgba(255,255,255,0.5)',
                background: 'transparent',
                cursor: 'pointer',
                border: `1px solid ${ACCENT_DIM}`,
                padding: '4px 8px',
              }}
            >
              Clear both
            </button>
            <button
              onClick={() => setCompareOpen(false)}
              className="text-white/50 hover:text-white"
              style={{ background: 'transparent', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div
          className="grid grid-cols-[160px_1fr_1fr] gap-3 px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div />
          {[
            { label: 'A', node: a },
            { label: 'B', node: b },
          ].map(({ label, node }) => (
            <div key={label}>
              <div
                className="font-mono uppercase"
                style={{
                  fontSize: 8,
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.3)',
                }}
              >
                {label}
              </div>
              <button
                onClick={() => onSelect(node.id)}
                className="mt-0.5 block text-left font-serif text-white hover:underline"
                style={{
                  fontSize: 22,
                  letterSpacing: '0.005em',
                  background: 'transparent',
                  cursor: 'pointer',
                  textShadow: `0 0 14px ${ACCENT_DIM}`,
                }}
              >
                {node.name}
              </button>
              <div
                className="mt-1 font-mono uppercase"
                style={{
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {node.kind} <span style={{ color: ACCENT_DIM }}>·</span>{' '}
                {node.difficulty}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {ROWS.map((row) => {
            const va = row.pick(a);
            const vb = row.pick(b);
            return (
              <div
                key={row.label}
                className="grid grid-cols-[160px_1fr_1fr] gap-3 py-3 last:border-b-0"
                style={{
                  fontSize: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="font-mono uppercase"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.22em',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {row.label}
                </div>
                <div className="text-white/80">{renderValue(va)}</div>
                <div className="text-white/80">{renderValue(vb)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
