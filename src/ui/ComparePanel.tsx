import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare } from 'lucide-react';
import GlassPanel from './primitives/GlassPanel';
import Chip from './primitives/Chip';
import { useGraphStore } from '../store/useGraphStore';
import { domainColor } from '../three/layout';
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

function renderValue(val: string | string[] | number | undefined) {
  if (val == null) return <span className="text-slate-600 italic">—</span>;
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-slate-600 italic">—</span>;
    return (
      <ul className="space-y-1">
        {val.map((v, i) => (
          <li key={i} className="list-disc pl-3 marker:text-cyan-300/60">
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
  const show = compareOpen && a && b;

  const colA = a ? domainColor(a.domainId) : '#22d3ee';
  const colB = b ? domainColor(b.domainId) : '#a78bfa';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur"
        >
          <GlassPanel className="flex h-full max-h-[88vh] w-full max-w-[1100px] flex-col">
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-300">
                <GitCompare size={14} className="text-emerald-300" />
                Compare
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => clearCompare()}
                  className="rounded-md border border-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                >
                  Clear both
                </button>
                <button
                  onClick={() => setCompareOpen(false)}
                  className="rounded-md p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[160px_1fr_1fr] gap-3 border-b border-white/5 px-5 py-4">
              <div></div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">A</div>
                <button
                  onClick={() => onSelect(a!.id)}
                  className="mt-0.5 text-left text-base font-semibold text-white hover:underline"
                  style={{ textShadow: `0 0 12px ${colA}55` }}
                >
                  {a!.name}
                </button>
                <div className="mt-1 flex gap-1.5">
                  <Chip tone="cyan" active>{a!.kind}</Chip>
                  <Chip tone="violet" active>{a!.difficulty}</Chip>
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">B</div>
                <button
                  onClick={() => onSelect(b!.id)}
                  className="mt-0.5 text-left text-base font-semibold text-white hover:underline"
                  style={{ textShadow: `0 0 12px ${colB}55` }}
                >
                  {b!.name}
                </button>
                <div className="mt-1 flex gap-1.5">
                  <Chip tone="cyan" active>{b!.kind}</Chip>
                  <Chip tone="violet" active>{b!.difficulty}</Chip>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {ROWS.map((row) => {
                const va = row.pick(a!);
                const vb = row.pick(b!);
                return (
                  <div
                    key={row.label}
                    className="grid grid-cols-[160px_1fr_1fr] gap-3 border-b border-white/5 py-3 text-[12px] last:border-b-0"
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                      {row.label}
                    </div>
                    <div className="text-slate-200">{renderValue(va)}</div>
                    <div className="text-slate-200">{renderValue(vb)}</div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
