import { useMemo } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode } from '../data/schema';
import type { Positioned } from '../three/layout';
import { Map } from 'lucide-react';

interface Props {
  nodes: GNode[];
  layout: globalThis.Map<string, Positioned>;
  emphasized: Set<string> | null;
  onPick: (id: string) => void;
}

const SIZE = 180;
const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

export default function Minimap({ nodes, layout, emphasized, onPick }: Props) {
  const show = useGraphStore((s) => s.showMinimap);
  const setShow = useGraphStore((s) => s.setShowMinimap);
  const selectedId = useGraphStore((s) => s.selectedId);

  const projection = useMemo(() => {
    const items: {
      id: string;
      x: number;
      y: number;
      r: number;
      emph: boolean;
    }[] = [];
    const R = 110;
    nodes.forEach((n) => {
      const p = layout.get(n.id);
      if (!p) return;
      const x = (p.position.x / R) * (SIZE / 2 - 8) + SIZE / 2;
      const y = (p.position.z / R) * (SIZE / 2 - 8) + SIZE / 2;
      const r =
        n.kind === 'domain' ? 3 : n.kind === 'subdomain' ? 1.6 : 0.9;
      const emph = !emphasized || emphasized.has(n.id);
      items.push({ id: n.id, x, y, r, emph });
    });
    return items;
  }, [nodes, layout, emphasized]);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="pointer-events-auto absolute bottom-5 left-5 z-10 hidden md:flex items-center gap-1.5 px-2.5 py-1.5 font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.65)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.7)',
          cursor: 'pointer',
        }}
      >
        <Map size={11} /> Show minimap
      </button>
    );
  }

  return (
    <div
      className="pointer-events-auto absolute bottom-5 left-5 z-10 hidden md:block p-2"
      style={{
        background: '#000',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Galaxy
        </span>
        <button
          onClick={() => setShow(false)}
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.4)',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          hide
        </button>
      </div>
      <svg
        width={SIZE}
        height={SIZE}
        style={{ background: '#000' }}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
      >
        <defs>
          <radialGradient id="mmGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={ACCENT_DIM} stopOpacity="0.5" />
            <stop offset="100%" stopColor={ACCENT_DIM} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={SIZE / 2 - 4}
          fill="url(#mmGlow)"
        />
        {projection.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={ACCENT}
            opacity={p.emph ? (p.id === selectedId ? 1 : 0.7) : 0.15}
            stroke={p.id === selectedId ? '#fff' : 'none'}
            strokeWidth={p.id === selectedId ? 1 : 0}
            style={{ cursor: 'pointer' }}
            onClick={() => onPick(p.id)}
          />
        ))}
      </svg>
    </div>
  );
}
