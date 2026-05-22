/* ───────────────────────────────────────────────────────────────────────────
   Galaxy scene treatment
   Side-by-side SVG sketches showing the rendering change:

     Before · 26 solid spheres + bloom halos, rainbow-coloured by domain
     After  · 26 particle constellations, single mint accent, density carries weight

   Sketches are deterministic — same seed = same shape every render.
   ─────────────────────────────────────────────────────────────────────────── */

// Simple seeded PRNG so the sketches stay stable across re-renders.
function makeRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

// 26 cluster centres on a 2D projection of a sphere (approximate Fibonacci-on-disc).
function clusterCenters() {
  const centers = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 26; i++) {
    // Project to disc — use Fibonacci spiral
    const y = 1 - (i / 25) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = phi * i;
    centers.push({
      x: Math.cos(t) * r * 240 + (Math.sin(i * 1.7) * 20),
      y: y * 220 + (Math.cos(i * 2.3) * 15),
      hue: (i * 360 / 26),
    });
  }
  return centers;
}
const CLUSTER_CENTERS = clusterCenters();

// ── BEFORE — solid spheres + bloom + rainbow ──────────────────────────────
function GalaxyBefore() {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at center, #0a0d18 0%, #05070d 70%)',
      fontFamily: "'Space Grotesk', sans-serif", color: '#fff',
      overflow: 'hidden',
    }}>
      <svg viewBox="-320 -300 640 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Halos */}
        {CLUSTER_CENTERS.map((c, i) => (
          <circle
            key={'h' + i} cx={c.x} cy={c.y} r="22"
            fill={`hsl(${c.hue}, 75%, 60%)`}
            opacity="0.18" filter="url(#blur8)"
          />
        ))}
        {/* Cores */}
        {CLUSTER_CENTERS.map((c, i) => (
          <circle
            key={'c' + i} cx={c.x} cy={c.y} r="6"
            fill={`hsl(${c.hue}, 80%, 65%)`}
            opacity="0.95"
          />
        ))}
        {/* Edge lines */}
        {CLUSTER_CENTERS.slice(0, 14).map((c, i) => {
          const target = CLUSTER_CENTERS[(i + 7) % CLUSTER_CENTERS.length];
          return (
            <line key={'e' + i} x1={c.x} y1={c.y} x2={target.x} y2={target.y}
              stroke={`hsl(${c.hue}, 60%, 60%)`} strokeWidth="0.4" opacity="0.3" />
          );
        })}
        <defs>
          <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
      </svg>

      <Annotation label="BEFORE" tone="warn">
        Solid spheres · bloom halos · 26 different hues
      </Annotation>
      <Caption>
        Every node a glowing button. Every domain a different color. Five-million-saturation rainbow.
      </Caption>
    </div>
  );
}

// ── AFTER — particle constellations, single accent ────────────────────────
function GalaxyAfter({ palette }) {
  const accent = palette.accent;
  const accentDim = palette.accentDim;

  // Generate particles per cluster
  const rand = makeRand(7);
  const particles = [];
  CLUSTER_CENTERS.forEach((c, ci) => {
    const count = 35 + Math.floor(rand() * 25);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.pow(rand(), 0.65) * 28;
      particles.push({
        x: c.x + Math.cos(a) * r,
        y: c.y + Math.sin(a) * r * 0.85,
        s: 0.4 + rand() * 0.8,
        b: 0.2 + rand() * 0.55,
      });
    }
    // Bright core
    for (let i = 0; i < 8; i++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * 4;
      particles.push({
        x: c.x + Math.cos(a) * r,
        y: c.y + Math.sin(a) * r,
        s: 1 + rand() * 0.8,
        b: 0.85 + rand() * 0.15,
        hot: true,
      });
    }
  });
  // Background dust
  const rand2 = makeRand(13);
  const dust = [];
  for (let i = 0; i < 350; i++) {
    dust.push({
      x: -320 + rand2() * 640,
      y: -300 + rand2() * 600,
      s: 0.3 + rand2() * 0.4,
      b: 0.05 + rand2() * 0.12,
    });
  }

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: '#000',
      fontFamily: "'Space Grotesk', sans-serif", color: '#fff',
      overflow: 'hidden',
    }}>
      <svg viewBox="-320 -300 640 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g style={{ mixBlendMode: 'screen' }}>
          {dust.map((p, i) => (
            <circle key={'d' + i} cx={p.x} cy={p.y} r={p.s} fill={accent} opacity={p.b} />
          ))}
          {particles.map((p, i) => (
            <circle key={'p' + i} cx={p.x} cy={p.y} r={p.s}
              fill={p.hot ? '#ffffff' : accent} opacity={p.b} />
          ))}
        </g>
      </svg>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
      }} />

      <Annotation label="AFTER" tone="good" palette={palette}>
        Particle constellations · single accent · density carries meaning
      </Annotation>
      <Caption>
        Each domain is a swarm. Brightness, not colour, marks importance.
        Type names the regions. The void does the rest.
      </Caption>

      {/* Region annotations (sample) */}
      <RegionLabel x="8%" y="20%" align="left" palette={palette} n=".01" name="FOUNDATIONS" />
      <RegionLabel x="92%" y="20%" align="right" palette={palette} n=".06" name="GENERATIVE AI" />
      <RegionLabel x="8%" y="80%" align="left" palette={palette} n=".04" name="DATA" />
    </div>
  );
}

function Annotation({ label, tone, palette, children }) {
  const color = tone === 'warn'
    ? '#F4B860'
    : palette
      ? palette.accent
      : '#5EEAB7';
  return (
    <div style={{
      position: 'absolute', top: 28, left: 32,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ fontSize: 9, letterSpacing: '0.28em', color }}>{label}</div>
      <div style={{
        marginTop: 5,
        fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
        fontSize: 14, color: 'rgba(255,255,255,0.78)',
        letterSpacing: '0.01em',
        maxWidth: 320,
      }}>{children}</div>
    </div>
  );
}
function Caption({ children }) {
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 32, right: 32,
      fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
      fontSize: 12, color: 'rgba(255,255,255,0.5)',
      lineHeight: 1.5, maxWidth: 480, letterSpacing: '0.005em',
    }}>{children}</div>
  );
}
function RegionLabel({ x, y, align, palette, n, name }) {
  const textAlign = align === 'right' ? 'right' : 'left';
  const transform = align === 'right' ? 'translate(-100%, -50%)' : 'translate(0, -50%)';
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform,
      textAlign,
      pointerEvents: 'none',
    }}>
      <div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
          letterSpacing: '0.22em', color: palette.accentDim, marginRight: 8,
        }}>{n}</span>
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500,
          fontSize: 10, letterSpacing: '0.26em', color: '#fff',
          textShadow: `0 0 10px ${palette.accentDim}`,
        }}>{name}</span>
      </div>
    </div>
  );
}

window.GalaxyBefore = GalaxyBefore;
window.GalaxyAfter = GalaxyAfter;
