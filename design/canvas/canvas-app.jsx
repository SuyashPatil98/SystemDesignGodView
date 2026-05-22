/* ───────────────────────────────────────────────────────────────────────────
   Canvas App
   God View · Helios redesign · two palettes locked: MINT (default) and IRIS.
   Composes the full redesign across sections so the user can review one
   surface at a time and see how the palette toggle behaves.
   ─────────────────────────────────────────────────────────────────────────── */

const MINT = {
  id: 'mint',
  name: 'MINT · STERILE',
  accent: '#5EEAB7',
  accentDim: 'rgba(94, 234, 183, 0.5)',
};
const IRIS = {
  id: 'iris',
  name: 'IRIS · INTERIOR',
  accent: '#B5A0FF',
  accentDim: 'rgba(181, 160, 255, 0.5)',
};

function App() {
  return (
    <DesignCanvas>
      {/* ── Section 1 — Node detail · two palettes ─────────────────────── */}
      <DCSection
        id="node-detail"
        title="01 · Node Detail · Two Palette Modes"
        subtitle="The current RightPanel reborn as a diegetic console. Pick a palette by toggling in the top bar — both committed to a single accent, religiously."
      >
        <DCArtboard id="node-mint" label="Mint · default" width={1280} height={800}>
          <NodeCard palette={MINT} />
        </DCArtboard>
        <DCArtboard id="node-iris" label="Iris · alt" width={1280} height={800}>
          <NodeCard palette={IRIS} />
        </DCArtboard>
      </DCSection>

      {/* ── Section 2 — Top bar redesign ───────────────────────────────── */}
      <DCSection
        id="top-bar"
        title="02 · Top Bar"
        subtitle="Removes the gradient logo cube, the rainbow mode chips, and the goldcrown conquest widget. Adds a wordmark column, a single-accent mode strip, slash-key search, palette toggle, and a hairline conquest counter."
      >
        <DCArtboard id="topbar-mint-default" label="Mint · default state" width={1440} height={150}>
          <TopBar palette={MINT} otherPalette={IRIS} activeMode="ATLAS" />
        </DCArtboard>
        <DCArtboard id="topbar-iris-default" label="Iris · toggled" width={1440} height={150}>
          <TopBar palette={IRIS} otherPalette={MINT} activeMode="ATLAS" />
        </DCArtboard>
        <DCArtboard id="topbar-mint-search" label="Mint · search active" width={1440} height={150}>
          <TopBar palette={MINT} otherPalette={IRIS} activeMode="ATLAS" searchValue="ACID transactions" searchFocused />
        </DCArtboard>
        <DCArtboard id="topbar-mint-hover" label="Mint · mode hovered (PATHS)" width={1440} height={150}>
          <TopBar palette={MINT} otherPalette={IRIS} activeMode="ATLAS" hoveredMode="PATHS" />
        </DCArtboard>
        <DCArtboard id="topbar-mint-mode" label="Mint · alt mode active (FAILURES)" width={1440} height={150}>
          <TopBar palette={MINT} otherPalette={IRIS} activeMode="FAILURES" />
        </DCArtboard>
      </DCSection>

      {/* ── Section 3 — Left panel redesign ────────────────────────────── */}
      <DCSection
        id="left-panel"
        title="03 · Left Navigator"
        subtitle="The glass-slab navigator stripped to a typography-led index — no chip pills, no gradients. Domain progress reads like a star chart: name → fraction → hairline."
      >
        <DCArtboard id="leftpanel-mint-collapsed" label="Mint · default (top 7 domains)" width={340} height={900}>
          <LeftPanel palette={MINT} mode="collapsed" />
        </DCArtboard>
        <DCArtboard id="leftpanel-mint-expanded" label="Mint · expanded" width={340} height={900}>
          <LeftPanel palette={MINT} mode="expanded" />
        </DCArtboard>
        <DCArtboard id="leftpanel-iris" label="Iris · expanded" width={340} height={900}>
          <LeftPanel palette={IRIS} mode="expanded" />
        </DCArtboard>
      </DCSection>

      {/* ── Section 4 — Galaxy scene treatment ─────────────────────────── */}
      <DCSection
        id="galaxy-scene"
        title="04 · Galaxy Scene · Render Shift"
        subtitle="The single biggest visual change. Solid spheres + bloom + rainbow domains become particle constellations + one accent. Same data, completely different feel."
      >
        <DCArtboard id="galaxy-before" label="Before · solid + bloom + rainbow" width={720} height={680}>
          <GalaxyBefore />
        </DCArtboard>
        <DCArtboard id="galaxy-after-mint" label="After · particle cloud · mint" width={720} height={680}>
          <GalaxyAfter palette={MINT} />
        </DCArtboard>
        <DCArtboard id="galaxy-after-iris" label="After · particle cloud · iris" width={720} height={680}>
          <GalaxyAfter palette={IRIS} />
        </DCArtboard>
      </DCSection>

      {/* ── Section 5 — Notes ──────────────────────────────────────────── */}
      <DCSection
        id="design-notes"
        title="05 · What changed and why"
        subtitle="Before / after notes — read top to bottom, then go back through the surfaces above."
      >
        <DCArtboard id="before" label="Before · current production UI" width={920} height={620}>
          <BeforeNote />
        </DCArtboard>
        <DCArtboard id="after" label="After · diegetic console" width={920} height={620}>
          <AfterNote />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

// ── Annotations ────────────────────────────────────────────────────────────
function BeforeNote() {
  return (
    <div style={noteStyle()}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.24em', color: '#8a8579', marginBottom: 16 }}>BEFORE · 2025</div>
      <h2 style={titleStyle()}>The Glass Slab</h2>

      <ul style={listStyle()}>
        <li><Strong>Five floating surfaces.</Strong> TopBar, LeftPanel, RightPanel, Minimap, ModeOverlay — five glass panels stacked over the galaxy. The 3D scene becomes the wallpaper.</li>
        <li><Strong>Rainbow accents.</Strong> Cyan / violet / rose / emerald / amber / 26 domain hues. Colour carries meaning, but no colour carries identity.</li>
        <li><Strong>Inter + JetBrains Mono.</Strong> Safe pairing — the default of every developer tool of the last five years.</li>
        <li><Strong>RightPanel: 15 sections, all scrollable, all the same weight.</Strong> Flat hierarchy, dense, fatigues fast.</li>
        <li><Strong>Bloom on every accent.</Strong> When everything glows, nothing does.</li>
        <li><Strong>Verdict.</Strong> Competent. Indistinguishable from a thousand other dark-mode dev tools.</li>
      </ul>
    </div>
  );
}

function AfterNote() {
  return (
    <div style={noteStyle()}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.24em', color: '#5e9a82', marginBottom: 16 }}>AFTER · 2026 · HELIOS REF</div>
      <h2 style={titleStyle()}>The Diegetic Console</h2>

      <ul style={listStyle()}>
        <li><Strong>No panels.</Strong> The RightPanel disappears. Content floats as annotations in the void — like a star chart, not a control surface.</li>
        <li><Strong>One accent, two modes.</Strong> Mint by default; Iris for evening / ML-heavy sessions. The whole interface chooses chromatically, and the toggle lives in the top bar.</li>
        <li><Strong>Editorial serif + grotesque + mono.</Strong> Instrument Serif headlines, Space Grotesk body, JetBrains Mono labels. A type system with character.</li>
        <li><Strong>Five fields, not fifteen.</Strong> Why · Model · Tradeoff · Fails · Watch. The rest is hidden until asked for.</li>
        <li><Strong>Particles, not spheres.</Strong> Each domain is a constellation, not a button. Density carries weight.</li>
        <li><Strong>Verdict.</Strong> A reference work, not a dashboard. Something to open every day.</li>
      </ul>
    </div>
  );
}

function Strong({ children }) {
  return <span style={{ color: '#1e1c17', fontWeight: 500 }}>{children}</span>;
}
function noteStyle() {
  return {
    width: '100%', height: '100%', padding: '64px 80px',
    background: '#f6f3ee', color: '#3a352b',
    fontFamily: "'Space Grotesk', sans-serif",
    overflow: 'hidden',
  };
}
function titleStyle() {
  return {
    fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400,
    fontSize: 48, lineHeight: 1, color: '#1e1c17',
    margin: '0 0 28px', letterSpacing: '0.002em',
  };
}
function listStyle() {
  return {
    margin: 0, padding: 0, listStyle: 'none',
    display: 'flex', flexDirection: 'column', gap: 16,
    fontSize: 14, lineHeight: 1.55, color: '#3a352b', maxWidth: 720,
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
