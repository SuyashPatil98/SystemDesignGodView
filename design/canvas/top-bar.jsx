/* ───────────────────────────────────────────────────────────────────────────
   TopBar redesign
   Strips the current top bar of: gradient logo cube, glow-text, rainbow mode
   chips, the goldcrown conquest widget.

   Replaces with:
     ▪ wordmark column   (italic serif name · meta · author credit)
     ▪ mode strip        (.NN labels, single accent for active)
     ▪ search slot       (thin underline, slash-key hint)
     ▪ palette toggle    (two swatches — Mint / Iris)
     ▪ conquest counter  (mono digits + hairline progress)
   ─────────────────────────────────────────────────────────────────────────── */

const MODES = [
  { n: '.01', name: 'ATLAS' },
  { n: '.02', name: 'PATHS' },
  { n: '.03', name: 'PROJECTS' },
  { n: '.04', name: 'TRADEOFFS' },
  { n: '.05', name: 'FAILURES' },
  { n: '.06', name: 'METRICS' },
  { n: '.07', name: 'PATTERNS' },
  { n: '.08', name: 'TOOLS' },
];

function TopBar({ palette, otherPalette, activeMode = 'ATLAS', searchValue = '', searchFocused = false, hoveredMode = null, isToggling = false }) {
  const accent = palette.accent;
  const accentDim = palette.accentDim;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#000', color: '#fff',
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden',
      padding: '20px 40px 22px',
      borderBottom: `1px solid rgba(255,255,255,0.05)`,
      display: 'grid',
      gridTemplateColumns: '300px 1fr 360px',
      alignItems: 'center',
      gap: 32,
    }}>

      {/* ── Wordmark column ────────────────────────────────────────────── */}
      <div>
        <div style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontWeight: 400, fontSize: 18, lineHeight: 1, color: '#fff',
          textTransform: 'none', letterSpacing: '0.02em',
        }}>God view.</div>
        <div style={{
          marginTop: 6,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.4)',
        }}>
          ATLAS · <span style={{ color: accent }}>VOL. I</span> · 2026
        </div>
        <div style={{
          marginTop: 4,
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontSize: 11, color: 'rgba(255,255,255,0.42)',
          letterSpacing: '0.02em',
        }}>
          by Suyash Patil <span style={{ color: accent, fontStyle: 'normal', fontSize: 10 }}>↗</span>
        </div>
      </div>

      {/* ── Mode strip ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, justifyContent: 'center', flexWrap: 'nowrap' }}>
        {MODES.map((m) => {
          const isActive = m.name === activeMode;
          const isHover  = m.name === hoveredMode;
          return (
            <div key={m.name} style={{
              display: 'flex', alignItems: 'baseline', gap: 5,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: isActive ? '#fff' : isHover ? accent : 'rgba(255,255,255,0.42)',
              cursor: 'pointer',
              position: 'relative',
              textShadow: isActive ? `0 0 12px ${accentDim}` : 'none',
              transition: 'color 200ms',
            }}>
              {isActive && <span style={{
                position: 'absolute', left: -10, top: 5,
                width: 4, height: 4, borderRadius: '50%',
                background: accent, boxShadow: `0 0 6px ${accent}`,
              }} />}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                color: isActive ? accent : 'rgba(255,255,255,0.32)',
              }}>{m.n}</span>
              <span>{m.name}</span>
            </div>
          );
        })}
      </div>

      {/* ── Right cluster: search + palette toggle + conquest ──────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, justifyContent: 'flex-end' }}>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingBottom: 6,
          borderBottom: `1px solid ${searchFocused ? accent : 'rgba(255,255,255,0.18)'}`,
          minWidth: 160,
          transition: 'border 200ms',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: searchFocused ? accent : 'rgba(255,255,255,0.4)',
            letterSpacing: '0.06em',
          }}>/</span>
          <span style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
            fontSize: 13, color: searchValue ? '#fff' : 'rgba(255,255,255,0.4)',
            letterSpacing: '0.01em', flex: 1,
          }}>{searchValue || 'Search the atlas'}</span>
          {searchFocused && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              color: accentDim, letterSpacing: '0.18em',
            }}>ESC</span>
          )}
        </div>

        {/* Palette toggle (two swatches) */}
        <PaletteToggle palette={palette} otherPalette={otherPalette} isToggling={isToggling} />

        {/* Conquest counter */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: 'rgba(255,255,255,0.78)',
            letterSpacing: '0.12em',
          }}>
            <span style={{ color: accent }}>012</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}> / 845</span>
          </div>
          <div style={{ marginTop: 6, height: 1, width: 80, background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: '8%', background: accent, boxShadow: `0 0 6px ${accent}`,
            }} />
          </div>
          <div style={{
            marginTop: 4,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
            letterSpacing: '0.24em', color: 'rgba(255,255,255,0.32)',
          }}>CONQUERED</div>
        </div>

      </div>
    </div>
  );
}

// ── Palette toggle (mint / iris) ────────────────────────────────────────────
function PaletteToggle({ palette, otherPalette, isToggling }) {
  // Show the active palette as a filled circle + label, the other as a hollow ring.
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '4px 6px',
      border: '1px solid rgba(255,255,255,0.1)',
      position: 'relative',
    }}>
      {/* Active swatch */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: palette.accent,
          boxShadow: `0 0 8px ${palette.accent}`,
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: '0.22em',
          color: '#fff',
        }}>{palette.id.toUpperCase()}</span>
      </div>
      {/* Other (inactive) swatch */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
        opacity: 0.5,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          border: `1px solid ${otherPalette.accent}`,
          background: 'transparent',
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.55)',
        }}>{otherPalette.id.toUpperCase()}</span>
      </div>
    </div>
  );
}

window.TopBar = TopBar;
window.PaletteToggle = PaletteToggle;
