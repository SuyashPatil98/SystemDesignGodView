import { create } from 'zustand';
import type { Mode, Filters, Difficulty, Layer } from '../data/schema';

const LS_KEY = 'tech-galaxy/conquered/v1';
const PALETTE_KEY = 'godview.palette.v1';
const NOTES_KEY = 'godview.notes.v1';
const OVERRIDES_KEY = 'godview.overrides.v1';

// ───────────────────── Palette (Surface .01) ─────────────────────
// The redesign uses a single accent — `--mint` — that is rebound between two
// hex values (mint / iris). Every accent-coloured pixel in CSS reads
// var(--mint), so toggling here retints the whole UI in one stroke.

export type Palette = 'mint' | 'iris';

const PALETTE_HEX: Record<Palette, string> = {
  mint: '#5EEAB7',
  iris: '#B5A0FF',
};

function hexToRgbaDim(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.45)`;
}

function loadPalette(): Palette {
  try {
    const raw = localStorage.getItem(PALETTE_KEY);
    if (raw === 'mint' || raw === 'iris') return raw;
  } catch {}
  return 'mint';
}

function applyPaletteToDOM(p: Palette) {
  if (typeof document === 'undefined') return;
  const hex = PALETTE_HEX[p];
  document.documentElement.style.setProperty('--mint', hex);
  document.documentElement.style.setProperty('--mint-dim', hexToRgbaDim(hex));
}

// Apply the persisted palette at module load — before the first render —
// so var(--mint) is already correct on the very first paint.
applyPaletteToDOM(loadPalette());

// ───────────────────── Personal notes (per-node) ─────────────────────
// Interpretation A: free-form annotations alongside the canned content.
// Stored as Map<nodeId, string>. Persisted as a plain object to localStorage.

function loadNotes(): Map<string, string> {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      const m = new Map<string, string>();
      for (const k of Object.keys(obj)) {
        if (typeof obj[k] === 'string') m.set(k, obj[k]);
      }
      return m;
    }
  } catch {}
  return new Map();
}

function saveNotes(m: Map<string, string>) {
  try {
    const obj: Record<string, string> = {};
    for (const [k, v] of m) obj[k] = v;
    localStorage.setItem(NOTES_KEY, JSON.stringify(obj));
  } catch {}
}

// ───────────────────── Canonical-callout overrides (per-node) ─────────────
// Lets the user supply or replace the canonical 5 callouts shown in the
// NodeDetailOverlay (.01 WHY IT MATTERS / .02 MENTAL MODEL / .03 TRADEOFF /
// .04 FAILS AS / .05 WATCH). The source data in src/data/* is never mutated;
// the overrides layer takes precedence at read time and is persisted to
// localStorage so it survives reloads.

export type OverrideField =
  | 'whyItMatters'
  | 'mentalModel'
  | 'tradeoffs'
  | 'failureModes'
  | 'metricsToMonitor';

export type NodeOverrides = Partial<Record<OverrideField, string>>;

function loadOverrides(): Map<string, NodeOverrides> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return new Map();
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      const m = new Map<string, NodeOverrides>();
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        if (v && typeof v === 'object') {
          const ov: NodeOverrides = {};
          for (const f of [
            'whyItMatters',
            'mentalModel',
            'tradeoffs',
            'failureModes',
            'metricsToMonitor',
          ] as OverrideField[]) {
            if (typeof v[f] === 'string') ov[f] = v[f];
          }
          if (Object.keys(ov).length > 0) m.set(k, ov);
        }
      }
      return m;
    }
  } catch {}
  return new Map();
}

function saveOverrides(m: Map<string, NodeOverrides>) {
  try {
    const obj: Record<string, NodeOverrides> = {};
    for (const [k, v] of m) obj[k] = v;
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(obj));
  } catch {}
}

function loadConquered(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr);
  } catch {}
  return new Set();
}

function saveConquered(s: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(s)));
  } catch {}
}

interface State {
  selectedId: string | null;
  hoveredId: string | null;
  // Camera focus: when set, the rig smoothly tweens to position + target.
  focusTarget: [number, number, number] | null;
  focusToken: number; // bumped every time setFocus is called so the rig can re-tween
  // Per-focus framing distance. CameraRig reads this to decide how close
  // to fly. Null = use the rig's default fallback. Set by handleSelect to
  // a kind-appropriate value so concepts zoom in tighter than domains.
  focusDistance: number | null;
  mode: Mode;
  activePathId: string | null;
  activeProjectId: string | null;
  activeTradeoffId: string | null;
  filters: Filters;
  // Progressive disclosure: which domains/subdomains are open right now.
  expandedDomainIds: Set<string>;
  expandedSubdomainIds: Set<string>;
  hasInteracted: boolean; // first-load hint dismissal
  showLegend: boolean;
  showHints: boolean;

  // Progress / conquest.
  conquered: Set<string>;
  showOnlyConquered: boolean;
  showOnlyUnconquered: boolean;

  // Focus mode — when set, the scene shows only the subtree + ancestors of this id
  // plus 1-hop cross-edge neighbours.
  focusedSubtreeId: string | null;

  // "You are here" — the domain closest to the camera target, refreshed by
  // NearestDomainTracker.
  nearestDomainId: string | null;

  // Mobile UI — hamburger toggles the left navigator drawer.
  mobileMenuOpen: boolean;

  // Compare mode — A4: pick two nodes and view them side-by-side.
  compareA: string | null;
  compareB: string | null;
  compareOpen: boolean;

  // Quiz mode — A3.
  quizOpen: boolean;
  quizDomainId: string | null;

  // Active palette (single-accent redesign). Rebinds --mint at runtime.
  palette: Palette;

  // Per-node personal notes (Interpretation A — alongside, not overriding).
  userNotes: Map<string, string>;

  // Per-node canonical-callout overrides (Interpretation B — replaces the
  // documented text at read time). The source data is never touched.
  overrides: Map<string, NodeOverrides>;

  // Whether the 2D mindmap overlay is open. Toggled from the top bar.
  mindmap2DOpen: boolean;

  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setMode: (m: Mode) => void;
  setActivePath: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  setActiveTradeoff: (id: string | null) => void;
  setFocus: (p: [number, number, number] | null, dist?: number | null) => void;
  setQuery: (q: string) => void;
  toggleDomainFilter: (id: string) => void;
  toggleDifficulty: (d: Difficulty) => void;
  toggleLayer: (l: Layer) => void;
  setMinInterview: (n: number) => void;
  setMinProduction: (n: number) => void;
  resetFilters: () => void;
  expandDomain: (id: string) => void;
  toggleDomainExpanded: (id: string) => void;
  expandSubdomain: (id: string) => void;
  toggleSubdomainExpanded: (id: string) => void;
  expandAll: (domainIds: string[], subdomainIds: string[]) => void;
  collapseAll: () => void;
  markInteracted: () => void;
  setShowLegend: (b: boolean) => void;
  setShowHints: (b: boolean) => void;

  setFocusedSubtree: (id: string | null) => void;
  setNearestDomain: (id: string | null) => void;
  setMobileMenuOpen: (b: boolean) => void;
  addToCompare: (id: string) => void;
  clearCompare: () => void;
  setCompareOpen: (b: boolean) => void;
  openQuiz: (domainId: string | null) => void;
  closeQuiz: () => void;

  // Conquest actions.
  conquer: (id: string) => void;
  unconquer: (id: string) => void;
  toggleConquered: (id: string) => void;
  clearConquered: () => void;
  setShowOnlyConquered: (b: boolean) => void;
  setShowOnlyUnconquered: (b: boolean) => void;

  setPalette: (p: Palette) => void;

  setNote: (id: string, text: string) => void;
  clearNote: (id: string) => void;
  clearAllNotes: () => void;
  replaceAllNotes: (entries: Record<string, string>) => void;

  setOverride: (nodeId: string, field: OverrideField, text: string) => void;
  clearOverride: (nodeId: string, field: OverrideField) => void;
  clearAllOverrides: () => void;

  setMindmap2DOpen: (b: boolean) => void;
}

const emptyFilters: Filters = {
  domainIds: new Set(),
  difficulty: new Set(),
  layer: new Set(),
  minInterview: 1,
  minProduction: 1,
  query: '',
};

export const useGraphStore = create<State>((set) => ({
  selectedId: null,
  hoveredId: null,
  focusTarget: null,
  focusToken: 0,
  focusDistance: null,
  mode: 'galaxy',
  activePathId: null,
  activeProjectId: null,
  activeTradeoffId: null,
  filters: emptyFilters,
  expandedDomainIds: new Set(),
  expandedSubdomainIds: new Set(),
  hasInteracted: false,
  showLegend: true,
  showHints: false,

  conquered: loadConquered(),
  showOnlyConquered: false,
  showOnlyUnconquered: false,
  focusedSubtreeId: null,
  nearestDomainId: null,
  mobileMenuOpen: false,
  compareA: null,
  compareB: null,
  compareOpen: false,
  quizOpen: false,
  quizDomainId: null,
  palette: loadPalette(),
  userNotes: loadNotes(),
  overrides: loadOverrides(),
  mindmap2DOpen: false,

  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoveredId: id }),
  setMode: (m) => set({ mode: m }),
  setActivePath: (id) => set({ activePathId: id, mode: id ? 'learning-path' : 'galaxy' }),
  setActiveProject: (id) =>
    set({ activeProjectId: id, mode: id ? 'project' : 'galaxy' }),
  setActiveTradeoff: (id) =>
    set({ activeTradeoffId: id, mode: id ? 'tradeoff' : 'galaxy' }),
  setFocus: (p, dist) =>
    set((s) => ({
      focusTarget: p,
      focusToken: s.focusToken + 1,
      focusDistance: dist ?? null,
    })),
  setQuery: (q) => set((s) => ({ filters: { ...s.filters, query: q } })),
  toggleDomainFilter: (id) =>
    set((s) => {
      const next = new Set(s.filters.domainIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { filters: { ...s.filters, domainIds: next } };
    }),
  toggleDifficulty: (d) =>
    set((s) => {
      const next = new Set(s.filters.difficulty);
      next.has(d) ? next.delete(d) : next.add(d);
      return { filters: { ...s.filters, difficulty: next } };
    }),
  toggleLayer: (l) =>
    set((s) => {
      const next = new Set(s.filters.layer);
      next.has(l) ? next.delete(l) : next.add(l);
      return { filters: { ...s.filters, layer: next } };
    }),
  setMinInterview: (n) =>
    set((s) => ({ filters: { ...s.filters, minInterview: n } })),
  setMinProduction: (n) =>
    set((s) => ({ filters: { ...s.filters, minProduction: n } })),
  resetFilters: () => set({ filters: emptyFilters }),
  expandDomain: (id) =>
    set((s) => {
      if (s.expandedDomainIds.has(id)) return {};
      const next = new Set(s.expandedDomainIds);
      next.add(id);
      return { expandedDomainIds: next };
    }),
  toggleDomainExpanded: (id) =>
    set((s) => {
      const next = new Set(s.expandedDomainIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { expandedDomainIds: next, hasInteracted: true };
    }),
  expandSubdomain: (id) =>
    set((s) => {
      if (s.expandedSubdomainIds.has(id)) return {};
      const next = new Set(s.expandedSubdomainIds);
      next.add(id);
      return { expandedSubdomainIds: next };
    }),
  toggleSubdomainExpanded: (id) =>
    set((s) => {
      const next = new Set(s.expandedSubdomainIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { expandedSubdomainIds: next, hasInteracted: true };
    }),
  expandAll: (domainIds, subdomainIds) =>
    set({
      expandedDomainIds: new Set(domainIds),
      expandedSubdomainIds: new Set(subdomainIds),
      hasInteracted: true,
    }),
  collapseAll: () =>
    set({
      expandedDomainIds: new Set(),
      expandedSubdomainIds: new Set(),
    }),
  markInteracted: () => set({ hasInteracted: true }),
  setShowLegend: (b) => set({ showLegend: b }),
  setShowHints: (b) => set({ showHints: b }),

  setFocusedSubtree: (id) => set({ focusedSubtreeId: id }),
  setNearestDomain: (id) =>
    set((s) => (s.nearestDomainId === id ? {} : { nearestDomainId: id })),
  setMobileMenuOpen: (b) => set({ mobileMenuOpen: b }),
  addToCompare: (id) =>
    set((s) => {
      if (s.compareA === id || s.compareB === id) {
        // Toggle off if already selected.
        return {
          compareA: s.compareA === id ? null : s.compareA,
          compareB: s.compareB === id ? null : s.compareB,
        };
      }
      if (!s.compareA) return { compareA: id };
      if (!s.compareB) return { compareB: id, compareOpen: true };
      // Both slots full — shift A out, B becomes A, new id is B.
      return { compareA: s.compareB, compareB: id, compareOpen: true };
    }),
  clearCompare: () => set({ compareA: null, compareB: null, compareOpen: false }),
  setCompareOpen: (b) => set({ compareOpen: b }),
  openQuiz: (domainId) => set({ quizOpen: true, quizDomainId: domainId }),
  closeQuiz: () => set({ quizOpen: false }),

  setPalette: (p) => {
    try { localStorage.setItem(PALETTE_KEY, p); } catch {}
    applyPaletteToDOM(p);
    set({ palette: p });
  },

  setNote: (id, text) =>
    set((s) => {
      const next = new Map(s.userNotes);
      const trimmed = text.trim();
      if (trimmed) next.set(id, trimmed);
      else next.delete(id);
      saveNotes(next);
      return { userNotes: next };
    }),
  clearNote: (id) =>
    set((s) => {
      if (!s.userNotes.has(id)) return {};
      const next = new Map(s.userNotes);
      next.delete(id);
      saveNotes(next);
      return { userNotes: next };
    }),
  clearAllNotes: () =>
    set(() => {
      saveNotes(new Map());
      return { userNotes: new Map() };
    }),
  replaceAllNotes: (entries) =>
    set(() => {
      const m = new Map<string, string>();
      for (const k of Object.keys(entries)) {
        if (typeof entries[k] === 'string' && entries[k].trim()) {
          m.set(k, entries[k]);
        }
      }
      saveNotes(m);
      return { userNotes: m };
    }),

  setOverride: (nodeId, field, text) =>
    set((s) => {
      const next = new Map(s.overrides);
      const prev = next.get(nodeId) ?? {};
      const trimmed = text.trim();
      const updated: NodeOverrides = { ...prev };
      if (trimmed) {
        updated[field] = trimmed;
      } else {
        delete updated[field];
      }
      if (Object.keys(updated).length > 0) next.set(nodeId, updated);
      else next.delete(nodeId);
      saveOverrides(next);
      return { overrides: next };
    }),
  clearOverride: (nodeId, field) =>
    set((s) => {
      const prev = s.overrides.get(nodeId);
      if (!prev || prev[field] === undefined) return {};
      const next = new Map(s.overrides);
      const updated: NodeOverrides = { ...prev };
      delete updated[field];
      if (Object.keys(updated).length > 0) next.set(nodeId, updated);
      else next.delete(nodeId);
      saveOverrides(next);
      return { overrides: next };
    }),
  clearAllOverrides: () =>
    set(() => {
      saveOverrides(new Map());
      return { overrides: new Map() };
    }),

  setMindmap2DOpen: (b) => set({ mindmap2DOpen: b }),

  conquer: (id) =>
    set((s) => {
      const next = new Set(s.conquered);
      next.add(id);
      saveConquered(next);
      return { conquered: next };
    }),
  unconquer: (id) =>
    set((s) => {
      const next = new Set(s.conquered);
      next.delete(id);
      saveConquered(next);
      return { conquered: next };
    }),
  toggleConquered: (id) =>
    set((s) => {
      const next = new Set(s.conquered);
      next.has(id) ? next.delete(id) : next.add(id);
      saveConquered(next);
      return { conquered: next };
    }),
  clearConquered: () =>
    set(() => {
      saveConquered(new Set());
      return { conquered: new Set() };
    }),
  setShowOnlyConquered: (b) =>
    set((s) => ({
      showOnlyConquered: b,
      showOnlyUnconquered: b ? false : s.showOnlyUnconquered,
    })),
  setShowOnlyUnconquered: (b) =>
    set((s) => ({
      showOnlyUnconquered: b,
      showOnlyConquered: b ? false : s.showOnlyConquered,
    })),
}));
