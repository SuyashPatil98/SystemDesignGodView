import { Compass, Sparkles, Network, Layers, AlertTriangle, Gauge, Boxes, Wrench, Crown } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import Chip from './primitives/Chip';
import SearchBox from './SearchBox';
import type { Mode, GNode } from '../data/schema';

interface Props {
  nodes: GNode[];
  onPickNode: (id: string) => void;
}

const modes: { id: Mode; label: string; icon: any; tone: any }[] = [
  { id: 'galaxy', label: 'Galaxy', icon: Compass, tone: 'cyan' },
  { id: 'learning-path', label: 'Paths', icon: Sparkles, tone: 'violet' },
  { id: 'project', label: 'Projects', icon: Boxes, tone: 'emerald' },
  { id: 'tradeoff', label: 'Tradeoffs', icon: Network, tone: 'rose' },
  { id: 'failure-mode', label: 'Failures', icon: AlertTriangle, tone: 'amber' },
  { id: 'metric', label: 'Metrics', icon: Gauge, tone: 'cyan' },
  { id: 'pattern', label: 'Patterns', icon: Layers, tone: 'violet' },
  { id: 'tool', label: 'Tools', icon: Wrench, tone: 'emerald' },
];

export default function TopBar({ nodes, onPickNode }: Props) {
  const mode = useGraphStore((s) => s.mode);
  const setMode = useGraphStore((s) => s.setMode);
  const conquered = useGraphStore((s) => s.conquered);

  // Only count "conquerable" nodes — exclude raw domain shells from the denominator.
  const total = nodes.filter((n) => n.kind !== 'domain').length;
  const done = nodes.filter((n) => n.kind !== 'domain' && conquered.has(n.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="pointer-events-auto absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-violet-400 to-rose-400 shadow-[0_0_24px_rgba(167,139,250,0.45)]">
          <div className="absolute inset-[3px] rounded-[10px] bg-ink-950 flex items-center justify-center">
            <Compass size={16} className="text-cyan-200" />
          </div>
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-white glow-text">
            Tech Galaxy
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
            A map of modern engineering
          </div>
        </div>

        {/* Conquest progress widget */}
        <div className="ml-3 flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-500/[0.06] px-3 py-1.5">
          <Crown size={13} className="text-amber-300" />
          <div className="flex items-center gap-2">
            <div className="font-mono text-[11px] font-semibold text-amber-100">
              {done}
              <span className="text-amber-300/50"> / {total}</span>
            </div>
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 transition-all duration-500"
                style={{ width: `${pct}%`, boxShadow: '0 0 12px rgba(251,191,36,0.5)' }}
              />
            </div>
            <div className="font-mono text-[10px] text-amber-300/80">{pct}%</div>
          </div>
        </div>
      </div>

      <SearchBox nodes={nodes} onPickNode={onPickNode} />

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <Chip
              key={m.id}
              active={mode === m.id}
              tone={m.tone}
              onClick={() => setMode(m.id)}
            >
              <Icon size={12} />
              {m.label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
