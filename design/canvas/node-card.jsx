/* ───────────────────────────────────────────────────────────────────────────
   NodeCard
   The redesigned "RightPanel" — but unboxed. Content lives in the void
   as diegetic annotations, not in a glass slab.

   Renders a full 1280×800 frame of the node-detail experience for any palette.
   Used inside the design canvas to A/B four color modes side-by-side.
   ─────────────────────────────────────────────────────────────────────────── */

const FEATURED = {
  number: '.02 / 06',
  region: 'STORAGE & MESSAGING',
  region_n: '.02',
  parent: 'DATABASES · TRANSACTIONS',
  title: 'ACID transactions',
  subtitle: 'Atomicity · Consistency · Isolation · Durability',
  lede:
    'A contract a database offers: a group of operations either all happen, leave the database in a valid state, are isolated from other in-flight work, and survive a crash.',
  fields: [
    { n: '.01', kind: 'WHY IT MATTERS',
      body: 'Without ACID, money disappears between accounts. It is what lets you reason about a database as a single mind.' },
    { n: '.02', kind: 'MENTAL MODEL',
      body: 'A sealed envelope. Opens. Mutates state in private. Commits whole, or is discarded entirely.' },
    { n: '.03', kind: 'TRADEOFF',
      body: 'Stronger isolation costs throughput. Pick the weakest level that still holds your invariants.' },
    { n: '.04', kind: 'FAILS AS',
      body: 'Lost updates · write skew · phantom reads · deadlocks · long-running transactions blocking the world.' },
    { n: '.05', kind: 'WATCH',
      body: 'Transaction rate · abort rate · lock-wait p99 · deadlock count · longest open transaction.' },
  ],
  related: ['Two-phase commit', 'MVCC', 'Isolation levels', 'CAP theorem', 'Sagas'],
};

// ── Deterministic particle generator — stable across remounts ─────────────
function buildParticles(seed) {
  let s = seed;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const pts = [];
  // Hot core — 70 small bright dots
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.pow(r(), 0.55) * 24;
    pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.8, s: 1.1 + r() * 0.9, b: 0.92 + r() * 0.08, hot: true });
  }
  // Mid ring — 360 medium dots
  for (let i = 0; i < 360; i++) {
    const a = r() * Math.PI * 2;
    const rad = 14 + Math.pow(r(), 0.6) * 90;
    pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.55, s: 0.5 + r() * 0.7, b: 0.4 + r() * 0.3 });
  }
  // Halo — 700 sparse outer dots
  for (let i = 0; i < 700; i++) {
    const a = r() * Math.PI * 2;
    const rad = 60 + Math.pow(r(), 0.4) * 240;
    pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad * 0.5, s: 0.35 + r() * 0.5, b: 0.06 + r() * 0.18 });
  }
  return pts;
}

const PARTICLES = buildParticles(42);

// ── Cluster SVG ──────────────────────────────────────────────────────────
function ParticleCluster({ palette }) {
  return (
    <svg
      viewBox="-340 -200 680 400"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 2,
      }}
    >
      <g style={{ mixBlendMode: 'screen' }}>
        {PARTICLES.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={p.s}
            fill={p.hot ? '#ffffff' : palette.accent}
            opacity={p.b}
          />
        ))}
      </g>
    </svg>
  );
}

// ── Orbital ring SVG ─────────────────────────────────────────────────────
function OrbitRing({ palette }) {
  return (
    <svg
      viewBox="-200 -200 400 400"
      style={{
        position: 'absolute',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 460, height: 460,
        pointerEvents: 'none', zIndex: 1,
      }}
    >
      <circle cx="0" cy="0" r="92" fill="none" stroke={palette.accentDim} strokeWidth="0.7" opacity="0.55" />
      <circle cx="0" cy="0" r="140" fill="none" stroke={palette.accentDim} strokeWidth="0.5" strokeDasharray="1 4" />
      <circle cx="0" cy="0" r="178" fill="none" stroke={palette.accentDim} strokeWidth="0.5" strokeDasharray="1 4" />
      {/* axis ticks */}
      {[
        [0, -188, 0, -168],
        [0, 188, 0, 168],
        [-188, 0, -168, 0],
        [188, 0, 168, 0],
        [-132, -132, -120, -120],
        [132, 132, 120, 120],
        [-132, 132, -120, 120],
        [132, -132, 120, -120],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.accent} strokeWidth="0.8" opacity="0.75" />
      ))}
    </svg>
  );
}

// ── Hairline from cluster center to a callout ────────────────────────────
function HairLine({ from, to, palette }) {
  return (
    <line
      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
      stroke={palette.accent} strokeWidth="0.6" opacity="0.45" strokeDasharray="2 3"
    />
  );
}

// ── Right-column callouts ─────────────────────────────────────────────────
function Callout({ field, palette }) {
  return (
    <div style={{
      width: 232, textAlign: 'left',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '0.22em',
        color: palette.accent,
        textTransform: 'uppercase',
      }}>
        <span style={{ color: palette.accentDim }}>{field.n}</span>
        <span>{field.kind}</span>
      </div>
      <div style={{
        fontWeight: 300, fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.5,
      }}>{field.body}</div>
    </div>
  );
}

// ── Main NodeCard component ───────────────────────────────────────────────
function NodeCard({ palette }) {
  // Palette: { id, name, subtitle, accent, accentDim, isWhite, sublabel }
  const accent = palette.accent;
  const accentDim = palette.accentDim;

  // Compute satellite anchor points (where each field "lives" in cluster space).
  // Used for the diegetic hairlines from callouts back into the cluster.
  // Coordinates are in cluster-svg space (centered at origin, units ≈ px).
  const satellites = [
    { x: 32,  y: -42 },  // top of cluster
    { x: 54,  y: -10 },  // upper-right
    { x: 58,  y: 18 },   // right
    { x: 38,  y: 50 },   // lower-right
    { x: -8,  y: 62 },   // bottom
  ];

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      background: '#000',
      color: '#fff',
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      overflow: 'hidden',
    }}>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />

      {/* Particle cluster (centered, mid-z) */}
      <ParticleCluster palette={palette} />

      {/* Orbit ring */}
      <OrbitRing palette={palette} />

      {/* Hairlines from cluster to right-column callouts.
          We approximate the callout entry points in viewport %.
          The SVG draws in the same coordinate as the cluster (centered svg). */}
      <svg
        viewBox="0 0 1280 800"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }}
      >
        {satellites.map((sat, i) => {
          // cluster origin is screen-center; sat is offset from there
          const cx = 1280 / 2 + sat.x;
          const cy = 800 / 2 + sat.y;
          // callout y positions (matches the right column below)
          const cyPos = [148, 268, 388, 508, 628][i];
          // entry point on callout (left edge of right column, ~970)
          const tx = 968;
          const ty = cyPos + 18;
          return (
            <line key={i}
              x1={cx} y1={cy} x2={tx} y2={ty}
              stroke={accent} strokeWidth="0.5" opacity="0.32" strokeDasharray="2 3"
            />
          );
        })}
      </svg>

      {/* ─── Top-left mark ─── */}
      <div style={{
        position: 'absolute', top: 36, left: 48, zIndex: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)',
      }}>
        <div style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontWeight: 400, fontSize: 17, color: '#fff', textTransform: 'none',
          letterSpacing: '0.02em', lineHeight: 1,
        }}>God view.</div>
        <div style={{ marginTop: 10 }}>
          ATLAS · <span style={{ color: accent }}>VOL. I</span> · 2026
        </div>
        <div style={{
          marginTop: 14,
          color: 'rgba(255,255,255,0.32)',
          letterSpacing: '0.22em',
          fontSize: 9, lineHeight: 1.7,
        }}>
          <div>NODES <span style={{ color: accent }}>000845</span> · EDGES <span style={{ color: accent }}>001210</span></div>
          <div>RA  <span style={{ color: accent }}>+003.182</span> · DEC <span style={{ color: accent }}>+021.477</span></div>
        </div>
        <div style={{
          marginTop: 16,
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontSize: 12, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em',
          textTransform: 'none',
        }}>
          by Suyash Patil <span style={{ color: accent, fontStyle: 'normal' }}>↗</span>
        </div>
      </div>

      {/* ─── Top-right breadcrumb ─── */}
      <div style={{
        position: 'absolute', top: 36, right: 48, zIndex: 6,
        textAlign: 'right', maxWidth: 320,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: '0.22em',
          color: 'rgba(255,255,255,0.36)',
        }}>
          {FEATURED.region} <span style={{ color: accent }}>{FEATURED.region_n}</span> · {FEATURED.parent}
        </div>
        <div style={{
          marginTop: 8,
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontSize: 13, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.02em',
        }}>{FEATURED.subtitle}</div>
      </div>

      {/* ─── Left column: big serif headline ─── */}
      <div style={{
        position: 'absolute', left: 64, top: '40%', zIndex: 6,
        maxWidth: 400,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: '0.28em',
          color: accent, marginBottom: 16,
        }}>{FEATURED.number}</div>
        <div style={{
          fontFamily: "'Instrument Serif', serif", fontWeight: 400,
          fontSize: 62, lineHeight: 0.95, color: '#fff',
          textShadow: `0 0 28px ${accentDim}`,
          letterSpacing: '0.005em',
        }}>{FEATURED.title}</div>
        <div style={{
          marginTop: 16,
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 300,
          fontSize: 10, letterSpacing: '0.26em', textTransform: 'uppercase',
          color: accent,
          opacity: palette.id === 'mono' ? 0.65 : 0.85,
        }}>STORAGE · DATABASES</div>
        <div style={{
          marginTop: 22,
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontSize: 17, lineHeight: 1.42,
          color: 'rgba(255,255,255,0.78)',
          maxWidth: 380, letterSpacing: 0,
        }}>{FEATURED.lede}</div>

        {/* Action row: 4 small buttons under the lede */}
        <div style={{
          marginTop: 30, display: 'flex', gap: 10,
        }}>
          {[
            { label: 'CONQUER', primary: true },
            { label: 'ISOLATE' },
            { label: 'COMPARE' },
            { label: 'COPY LINK' },
          ].map(b => (
            <div key={b.label} style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, letterSpacing: '0.22em',
              padding: '7px 11px',
              border: `1px solid ${b.primary ? accent : 'rgba(255,255,255,0.18)'}`,
              color: b.primary ? accent : 'rgba(255,255,255,0.6)',
              background: b.primary ? `${accent}10` : 'transparent',
            }}>{b.label}</div>
          ))}
        </div>
      </div>

      {/* ─── Center: floating "core" caption under cluster ─── */}
      <div style={{
        position: 'absolute',
        left: '50%', top: 'calc(50% + 100px)',
        transform: 'translateX(-50%)',
        zIndex: 5,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '0.22em',
        color: accent, textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        {FEATURED.title} · CORE
      </div>

      {/* ─── Right column: 5 callouts ─── */}
      <div style={{
        position: 'absolute', right: 48, top: 130, zIndex: 6,
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        {FEATURED.fields.map((f, i) => (
          <Callout key={i} field={f} palette={palette} />
        ))}
      </div>

      {/* ─── Bottom: related concepts constellation ─── */}
      <div style={{
        position: 'absolute', left: 64, bottom: 36, zIndex: 6,
        maxWidth: 540,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)',
          marginBottom: 10,
        }}>RELATED · 5</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'baseline' }}>
          {FEATURED.related.map((r, i) => (
            <div key={r} style={{
              fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
              fontSize: 14, color: 'rgba(255,255,255,0.55)',
            }}>
              {r}
              {i < FEATURED.related.length - 1 && (
                <span style={{ marginLeft: 16, color: 'rgba(255,255,255,0.2)' }}>·</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Bottom-right hint ─── */}
      <div style={{
        position: 'absolute', right: 48, bottom: 36, zIndex: 6,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.32)',
      }}>
        <span style={{
          color: accent,
          border: `1px solid ${accentDim}`,
          padding: '2px 6px', marginRight: 6,
        }}>ESC</span> BACK TO ATLAS
      </div>

      {/* ─── Palette identifier strip (only visible in design canvas) ─── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: 3, background: accent, opacity: 0.85, zIndex: 7,
      }} />
    </div>
  );
}

window.NodeCard = NodeCard;
