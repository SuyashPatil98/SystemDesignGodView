import { useState } from 'react';
import { Compass, Sparkles, Network, Layers, AlertTriangle, Gauge, Boxes, Wrench, Crown, Menu, X } from 'lucide-react';
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
  const mobileMenuOpen = useGraphStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useGraphStore((s) => s.setMobileMenuOpen);
  const [modesOpen, setModesOpen] = useState(false);

  const total = nodes.filter((n) => n.kind !== 'domain').length;
  const done = nodes.filter((n) => n.kind !== 'domain' && conquered.has(n.id)).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="pointer-events-auto absolute left-0 right-0 top-0 z-20 flex items-center gap-2 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="sm:hidden flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-ink-900/70 text-slate-200 hover:bg-ink-800"
        aria-label="Open navigator"
      >
        {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      <div className="hidden sm:flex items-center gap-3">
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

        {/* Conquest progress widget — desktop only */}
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

      {/* Compact title on mobile */}
      <div className="sm:hidden flex items-center gap-2">
        <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-cyan-400 via-violet-400 to-rose-400">
          <div className="absolute inset-[2px] rounded bg-ink-950 flex items-center justify-center">
            <Compass size={12} className="text-cyan-200" />
          </div>
        </div>
        <span className="text-[12px] font-semibold text-white">Tech Galaxy</span>
      </div>

      <div className="flex-1 flex justify-center">
        <SearchBox nodes={nodes} onPickNode={onPickNode} />
      </div>

      {/* Desktop mode chips */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto">
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

      {/* Mobile modes button */}
      <div className="md:hidden relative">
        <button
          onClick={() => setModesOpen(!modesOpen)}
          className="flex h-9 items-center gap-1.5 rounded-md border border-white/10 bg-ink-900/70 px-2.5 text-[11px] text-slate-200 hover:bg-ink-800"
        >
          <Layers size={12} />
          Modes
        </button>
        {modesOpen && (
          <div
            className="glass absolute right-0 top-full z-30 mt-2 grid grid-cols-2 gap-1 rounded-xl p-2 w-56"
            onClick={() => setModesOpen(false)}
          >
            {modes.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-[11px] ${
                    mode === m.id
                      ? 'bg-white/10 text-white'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon size={12} />
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
