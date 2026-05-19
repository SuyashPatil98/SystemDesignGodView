import { useMemo } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode } from '../data/schema';
import type { Positioned } from '../three/layout';
import GlassPanel from './primitives/GlassPanel';
import { Map } from 'lucide-react';

interface Props {
  nodes: GNode[];
  layout: globalThis.Map<string, Positioned>;
  emphasized: Set<string> | null;
  onPick: (id: string) => void;
}

const SIZE = 180;

export default function Minimap({ nodes, layout, emphasized, onPick }: Props) {
  const show = useGraphStore((s) => s.showMinimap);
  const setShow = useGraphStore((s) => s.setShowMinimap);
  const selectedId = useGraphStore((s) => s.selectedId);

  const projection = useMemo(() => {
    // Orthographic projection onto XZ plane.
    const items: { id: string; x: number; y: number; r: number; col: string; emph: boolean }[] = [];
    const R = 110;
    nodes.forEach((n) => {
      const p = layout.get(n.id);
      if (!p) return;
      const x = (p.position.x / R) * (SIZE / 2 - 8) + SIZE / 2;
      const y = (p.position.z / R) * (SIZE / 2 - 8) + SIZE / 2;
      const r =
        n.kind === 'domain' ? 3 : n.kind === 'subdomain' ? 1.6 : 0.9;
      const emph = !emphasized || emphasized.has(n.id);
      const col = `rgb(${Math.round(p.color.r * 255)},${Math.round(p.color.g * 255)},${Math.round(p.color.b * 255)})`;
      items.push({ id: n.id, x, y, r, col, emph });
    });
    return items;
  }, [nodes, layout, emphasized]);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="pointer-events-auto absolute bottom-5 left-5 z-10 flex items-center gap-1.5 rounded-md border border-white/10 bg-ink-900/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-ink-800"
      >
        <Map size={12} /> Show minimap
      </button>
    );
  }

  return (
    <GlassPanel className="pointer-events-auto absolute bottom-5 left-5 z-10 p-2">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Galaxy
        </span>
        <button
          onClick={() => setShow(false)}
          className="text-[10px] text-slate-500 hover:text-slate-200"
        >
          hide
        </button>
      </div>
      <svg
        width={SIZE}
        height={SIZE}
        className="rounded-lg bg-ink-950"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <defs>
          <radialGradient id="mmGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 4} fill="url(#mmGlow)" />
        {projection.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.col}
            opacity={p.emph ? (p.id === selectedId ? 1 : 0.8) : 0.18}
            stroke={p.id === selectedId ? '#fff' : 'none'}
            strokeWidth={p.id === selectedId ? 1 : 0}
            className="cursor-pointer"
            onClick={() => onPick(p.id)}
          />
        ))}
      </svg>
    </GlassPanel>
  );
}
