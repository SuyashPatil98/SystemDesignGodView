import { Menu, X } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import SearchBox from './SearchBox';
import type { Mode, GNode } from '../data/schema';
import type { Palette as StorePalette } from '../store/useGraphStore';

interface Props {
  nodes: GNode[];
  onPickNode: (id: string) => void;
}

const MODES: { id: Mode; num: string; name: string }[] = [
  { id: 'galaxy',        num: '.01', name: 'ATLAS' },
  { id: 'learning-path', num: '.02', name: 'PATHS' },
  { id: 'project',       num: '.03', name: 'PROJECTS' },
  { id: 'tradeoff',      num: '.04', name: 'TRADEOFFS' },
  { id: 'failure-mode',  num: '.05', name: 'FAILURES' },
  { id: 'metric',        num: '.06', name: 'METRICS' },
  { id: 'pattern',       num: '.07', name: 'PATTERNS' },
  { id: 'tool',          num: '.08', name: 'TOOLS' },
];

const ACCENT = 'var(--mint)';
const ACCENT_DIM = 'var(--mint-dim)';

export default function TopBar({ nodes, onPickNode }: Props) {
  const mode = useGraphStore((s) => s.mode);
  const setMode = useGraphStore((s) => s.setMode);
  const conquered = useGraphStore((s) => s.conquered);
  const palette = useGraphStore((s) => s.palette);
  const setPalette = useGraphStore((s) => s.setPalette);
  const mobileMenuOpen = useGraphStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useGraphStore((s) => s.setMobileMenuOpen);

  const total = nodes.filter((n) => n.kind !== 'domain').length;
  const done = nodes.filter(
    (n) => n.kind !== 'domain' && conquered.has(n.id),
  ).length;

  return (
    <header
      className="pointer-events-auto absolute left-0 right-0 top-0 z-20
                 grid items-center gap-8
                 grid-cols-[1fr_auto] md:grid-cols-[300px_1fr_auto]
                 border-b px-5 py-4 md:px-10 md:py-5"
      style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#000' }}
    >
      {/* ── Wordmark column ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — sits before the wordmark on small screens */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex h-8 w-8 items-center justify-center
                     border border-white/10 text-white/80 hover:text-white"
          aria-label="Open navigator"
        >
          {mobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
        </button>

        <div className="leading-tight">
          <div
            className="font-serif italic text-white"
            style={{
              fontSize: 18,
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}
          >
            God view.
          </div>
          <div
            className="mt-1.5 hidden md:block font-mono text-white/40"
            style={{ fontSize: 9, letterSpacing: '0.22em' }}
          >
            ATLAS <span style={{ color: ACCENT }}>·</span> VOL. I{' '}
            <span style={{ color: ACCENT }}>·</span> 2026
          </div>
          <a
            href="https://suyashpatil.me"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 hidden md:inline-flex items-center gap-1 font-serif italic text-white/45 hover:text-white"
            style={{ fontSize: 11, letterSpacing: '0.02em' }}
          >
            by Suyash Patil
            <span style={{ color: ACCENT, fontStyle: 'normal', fontSize: 10 }}>
              ↗
            </span>
          </a>
        </div>
      </div>

      {/* ── Mode strip ─────────────────────────────────────────────────── */}
      <nav className="hidden md:flex items-baseline justify-center gap-7">
        {MODES.map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="relative font-sans uppercase transition-colors"
              style={{
                fontSize: 11,
                fontWeight: 400,
                letterSpacing: '0.22em',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.42)',
                textShadow: isActive ? `0 0 12px ${ACCENT_DIM}` : 'none',
                display: 'inline-flex',
                alignItems: 'baseline',
                gap: 6,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = ACCENT;
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.color = 'rgba(255,255,255,0.42)';
              }}
            >
              {isActive && (
                <span
                  className="absolute"
                  style={{
                    left: -10,
                    top: 5,
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: ACCENT,
                    boxShadow: `0 0 6px ${ACCENT}`,
                  }}
                />
              )}
              <span
                className="font-mono"
                style={{
                  fontSize: 9,
                  color: isActive ? ACCENT : 'rgba(255,255,255,0.32)',
                }}
              >
                {m.num}
              </span>
              <span>{m.name}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Right cluster: search + palette + conquest ─────────────────── */}
      <div className="hidden md:flex items-center justify-end gap-6">
        <SearchBox nodes={nodes} onPickNode={onPickNode} />
        <PaletteToggle active={palette} onChange={setPalette} />
        <ConquestCounter done={done} total={total} />
      </div>
    </header>
  );
}

// ── Palette toggle ─────────────────────────────────────────────────────────
function PaletteToggle({
  active,
  onChange,
}: {
  active: StorePalette;
  onChange: (p: StorePalette) => void;
}) {
  const HEX: Record<StorePalette, string> = {
    mint: '#5EEAB7',
    iris: '#B5A0FF',
  };
  const ids: StorePalette[] = ['mint', 'iris'];

  return (
    <div
      className="flex items-center"
      style={{
        padding: '4px 6px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      role="radiogroup"
      aria-label="Accent palette"
    >
      {ids.map((id) => {
        const isActive = active === id;
        const hex = HEX[id];
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            role="radio"
            aria-checked={isActive}
            className="flex items-center"
            style={{
              gap: 6,
              padding: '4px 8px',
              opacity: isActive ? 1 : 0.5,
              cursor: 'pointer',
              background: 'transparent',
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: isActive ? hex : 'transparent',
                border: isActive ? 'none' : `1px solid ${hex}`,
                boxShadow: isActive ? `0 0 8px ${hex}` : 'none',
                display: 'inline-block',
              }}
            />
            <span
              className="font-mono"
              style={{
                fontSize: 9,
                letterSpacing: '0.22em',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              }}
            >
              {id.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Conquest counter ───────────────────────────────────────────────────────
function ConquestCounter({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.min(1, done / total) : 0;

  return (
    <div className="text-right select-none">
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.78)',
        }}
      >
        <span style={{ color: ACCENT }}>{done}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}> / {total}</span>
      </div>
      <div
        className="relative mt-1.5"
        style={{ height: 1, width: 80, background: 'rgba(255,255,255,0.08)' }}
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
      <div
        className="mt-1 font-mono"
        style={{
          fontSize: 8,
          letterSpacing: '0.24em',
          color: 'rgba(255,255,255,0.32)',
        }}
      >
        CONQUERED
      </div>
    </div>
  );
}
