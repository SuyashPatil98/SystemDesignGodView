/* ───────────────────────────────────────────────────────────────────────────
   LeftPanel redesign
   Replaces the glass-slab navigator with a typography-led index.
   No container. No backdrop blur. No coloured chip pills.
   Domain progress reads like a star chart: name → count → hairline.
   ─────────────────────────────────────────────────────────────────────────── */

const DOMAINS_SAMPLE = [
  { name: 'System Design',          done: 4,  total: 18, region: 'foundations' },
  { name: 'Distributed Systems',    done: 2,  total: 22, region: 'foundations' },
  { name: 'Backend Engineering',    done: 6,  total: 16, region: 'foundations' },
  { name: 'API Design',             done: 1,  total: 11, region: 'foundations' },
  { name: 'Databases',              done: 9,  total: 31, region: 'storage' },
  { name: 'Caching',                done: 3,  total: 14, region: 'storage' },
  { name: 'Messaging & Event-Driven', done: 0, total: 20, region: 'storage' },
  { name: 'DevOps',                 done: 0,  total: 17, region: 'devops' },
  { name: 'Cloud Computing',        done: 0,  total: 24, region: 'devops' },
  { name: 'Kubernetes',             done: 0,  total: 19, region: 'devops' },
  { name: 'CI/CD',                  done: 0,  total: 12, region: 'devops' },
  { name: 'Observability',          done: 0,  total: 16, region: 'devops' },
];

function LeftPanel({ palette, mode = 'collapsed' }) {
  const accent = palette.accent;
  const accentDim = palette.accentDim;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#000', color: '#fff',
      padding: '36px 32px',
      fontFamily: "'Space Grotesk', sans-serif",
      overflow: 'hidden',
      position: 'relative',
      borderRight: '1px solid rgba(255,255,255,0.04)',
    }}>

      {/* Section eyebrow */}
      <SectionHead label="NAVIGATOR" n=".N1" palette={palette} />

      {/* VIEW row */}
      <SectionHead label="VIEW" n=".N2" palette={palette} top={32} />
      <div style={textRowStyle()}>
        <Link palette={palette}>Expand all</Link>
        <Dot palette={palette} />
        <Link palette={palette} muted>Collapse</Link>
      </div>

      {/* CONQUEST */}
      <SectionHead label="CONQUEST" n=".N3" palette={palette} top={32} active />

      <div style={{ marginTop: 14 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 26, letterSpacing: '0.06em',
          color: '#fff', display: 'flex', alignItems: 'baseline',
        }}>
          <span style={{ color: accent }}>012</span>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, margin: '0 6px' }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>845</span>
        </div>
        <div style={{
          marginTop: 4,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.4)',
        }}>NODES CONQUERED · 1.4%</div>
        <div style={{ marginTop: 10, height: 1, width: '100%', background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', width: '8%', background: accent,
            boxShadow: `0 0 6px ${accent}`,
          }} />
        </div>
      </div>

      {/* Per-domain list with hairline progress */}
      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {DOMAINS_SAMPLE.slice(0, mode === 'expanded' ? DOMAINS_SAMPLE.length : 7).map((d) => {
          const pct = d.total > 0 ? d.done / d.total : 0;
          return (
            <div key={d.name} style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 11, fontWeight: 400, letterSpacing: '0.01em',
                  color: d.done > 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
                }}>{d.name}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, letterSpacing: '0.08em', textAlign: 'right',
                  color: d.done > 0 ? accent : 'rgba(255,255,255,0.3)', flexShrink: 0, marginLeft: 12,
                }}>{String(d.done).padStart(2, '0')}/{String(d.total).padStart(2, '0')}</span>
              </div>
              <div style={{ marginTop: 4, height: 1, width: '100%', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ height: '100%', width: `${pct * 100}%`, background: accent, opacity: 0.7 }} />
              </div>
            </div>
          );
        })}
      </div>

      <a style={{
        marginTop: 22, display: 'inline-block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: '0.22em',
        color: accent, textDecoration: 'none',
        padding: '8px 0',
        borderTop: `1px solid ${accentDim}`,
        borderBottom: `1px solid ${accentDim}`,
        width: '100%',
        textAlign: 'center',
      }}>QUIZ ME →</a>

      {/* FILTERS */}
      <SectionHead label="FILTERS" n=".N4" palette={palette} top={28} />

      <div style={{ marginTop: 12 }}>
        <Eyebrow palette={palette}>DIFFICULTY</Eyebrow>
        <div style={textRowStyle()}>
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((d, i, arr) => (
            <span key={d}>
              <Tag palette={palette} active={d === 'Intermediate'}>{d}</Tag>
              {i < arr.length - 1 && <Dot palette={palette} />}
            </span>
          ))}
        </div>

        <Eyebrow palette={palette} top={14}>LAYER</Eyebrow>
        <div style={textRowStyle()}>
          {['Conceptual', 'Architectural', 'Implementation', 'Operational', 'Optimization'].map((d, i, arr) => (
            <span key={d}>
              <Tag palette={palette}>{d}</Tag>
              {i < arr.length - 1 && <Dot palette={palette} />}
            </span>
          ))}
        </div>

        <Eyebrow palette={palette} top={14}>RELEVANCE</Eyebrow>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <RelevanceLine label="Interview" value={3} accent={accent} />
          <RelevanceLine label="Production" value={4} accent={accent} />
        </div>
      </div>

    </div>
  );
}

// ── Sub-elements ───────────────────────────────────────────────────────────
function SectionHead({ label, n, top = 0, palette, active = false }) {
  return (
    <div style={{
      marginTop: top,
      display: 'flex', alignItems: 'baseline', gap: 8,
      paddingBottom: 6,
      borderBottom: `1px solid ${active ? palette.accentDim : 'rgba(255,255,255,0.07)'}`,
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8, letterSpacing: '0.22em',
        color: 'rgba(255,255,255,0.3)',
      }}>{n}</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: '0.28em',
        color: active ? palette.accent : 'rgba(255,255,255,0.7)',
      }}>{label}</span>
      {active && (
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: palette.accent, boxShadow: `0 0 6px ${palette.accent}`,
          marginLeft: 'auto', alignSelf: 'center',
        }} />
      )}
    </div>
  );
}
function Eyebrow({ children, palette, top = 0 }) {
  return (
    <div style={{
      marginTop: top,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 8, letterSpacing: '0.32em',
      color: 'rgba(255,255,255,0.42)',
      marginBottom: 5,
    }}>{children}</div>
  );
}
function Link({ children, palette, muted }) {
  return (
    <span style={{
      fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
      fontSize: 13, color: muted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
      cursor: 'pointer', letterSpacing: '0.01em',
    }}>{children}</span>
  );
}
function Tag({ children, palette, active }) {
  return (
    <span style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
      color: active ? palette.accent : 'rgba(255,255,255,0.55)',
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}
function Dot({ palette }) {
  return <span style={{ color: 'rgba(255,255,255,0.18)', margin: '0 7px' }}>·</span>;
}
function RelevanceLine({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
        fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1,
      }}>{label}</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{
            width: 8, height: 2,
            background: i <= value ? accent : 'rgba(255,255,255,0.12)',
            display: 'block',
          }} />
        ))}
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
        color: accent, letterSpacing: '0.12em', width: 18, textAlign: 'right',
      }}>{value}+</span>
    </div>
  );
}
function textRowStyle() {
  return { marginTop: 8, fontSize: 13, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' };
}

window.LeftPanel = LeftPanel;
