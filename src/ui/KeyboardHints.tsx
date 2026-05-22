import { Keyboard, X, Mouse } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';

const movement: [string, string][] = [
  ['W A S D', 'Fly'],
  ['Q E', 'Down / Up'],
  ['Shift', 'Sprint'],
];

const shortcuts: [string, string][] = [
  ['/', 'Search'],
  ['Esc', 'Clear / Unfocus'],
  ['F', 'Re-focus selected'],
  ['C', 'Reset camera'],
  ['1-8', 'Switch mode'],
];

const mouseRows: [string, string][] = [
  ['Left drag', 'Orbit'],
  ['Right drag', 'Pan'],
  ['Wheel', 'Zoom'],
];

const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

export default function KeyboardHints() {
  const show = useGraphStore((s) => s.showHints);
  const setShow = useGraphStore((s) => s.setShowHints);
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="pointer-events-auto absolute bottom-5 right-5 z-10 hidden md:flex items-center gap-1.5 px-2 py-1 font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.7)',
          cursor: 'pointer',
        }}
      >
        <Keyboard size={11} style={{ color: ACCENT }} /> Controls
      </button>
    );
  }
  return (
    <div
      className="pointer-events-auto absolute bottom-5 right-5 z-10 hidden md:block max-w-[420px] px-3.5 py-3"
      style={{
        background: 'rgba(0,0,0,0.82)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 9,
            letterSpacing: '0.28em',
            color: ACCENT,
          }}
        >
          Controls
        </span>
        <button
          onClick={() => setShow(false)}
          className="transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)', background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')
          }
        >
          <X size={12} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-1">
        <HintColumn icon={<Keyboard size={10} />} label="Move" rows={movement} />
        <HintColumn icon={<Mouse size={10} />} label="Look" rows={mouseRows} />
        <HintColumn
          icon={<Keyboard size={10} />}
          label="Shortcuts"
          rows={shortcuts}
        />
      </div>
    </div>
  );
}

function HintColumn({
  icon,
  label,
  rows,
}: {
  icon: React.ReactNode;
  label: string;
  rows: [string, string][];
}) {
  return (
    <div>
      <div
        className="mb-1 flex items-center gap-1.5 font-mono uppercase"
        style={{
          fontSize: 9,
          letterSpacing: '0.22em',
          color: ACCENT_DIM,
        }}
      >
        <span style={{ color: ACCENT }}>{icon}</span>
        {label}
      </div>
      {rows.map(([k, l]) => (
        <div
          key={k}
          className="flex items-center justify-between gap-2 py-0.5"
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}
        >
          <span
            className="font-mono"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            {k}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.45)' }}>{l}</span>
        </div>
      ))}
    </div>
  );
}
