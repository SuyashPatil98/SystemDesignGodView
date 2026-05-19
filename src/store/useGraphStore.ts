import { create } from 'zustand';
import type { Mode, Filters, Difficulty, Layer } from '../data/schema';

const LS_KEY = 'tech-galaxy/conquered/v1';

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
  mode: Mode;
  activePathId: string | null;
  activeProjectId: string | null;
  activeTradeoffId: string | null;
  filters: Filters;
  expandedDomains: Set<string>;
  showMinimap: boolean;
  showLegend: boolean;
  showHints: boolean;

  // Progress / conquest.
  conquered: Set<string>;
  showOnlyConquered: boolean;
  showOnlyUnconquered: boolean;

  // Focus mode — when set, the scene shows only the subtree + ancestors of this id
  // plus 1-hop cross-edge neighbours.
  focusedSubtreeId: string | null;

  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setMode: (m: Mode) => void;
  setActivePath: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  setActiveTradeoff: (id: string | null) => void;
  setFocus: (p: [number, number, number] | null) => void;
  setQuery: (q: string) => void;
  toggleDomainFilter: (id: string) => void;
  toggleDifficulty: (d: Difficulty) => void;
  toggleLayer: (l: Layer) => void;
  setMinInterview: (n: number) => void;
  setMinProduction: (n: number) => void;
  resetFilters: () => void;
  toggleDomainExpanded: (id: string) => void;
  setShowMinimap: (b: boolean) => void;
  setShowLegend: (b: boolean) => void;
  setShowHints: (b: boolean) => void;

  setFocusedSubtree: (id: string | null) => void;

  // Conquest actions.
  conquer: (id: string) => void;
  unconquer: (id: string) => void;
  toggleConquered: (id: string) => void;
  clearConquered: () => void;
  setShowOnlyConquered: (b: boolean) => void;
  setShowOnlyUnconquered: (b: boolean) => void;
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
  mode: 'galaxy',
  activePathId: null,
  activeProjectId: null,
  activeTradeoffId: null,
  filters: emptyFilters,
  expandedDomains: new Set(),
  showMinimap: true,
  showLegend: true,
  showHints: true,

  conquered: loadConquered(),
  showOnlyConquered: false,
  showOnlyUnconquered: false,
  focusedSubtreeId: null,

  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoveredId: id }),
  setMode: (m) => set({ mode: m }),
  setActivePath: (id) => set({ activePathId: id, mode: id ? 'learning-path' : 'galaxy' }),
  setActiveProject: (id) =>
    set({ activeProjectId: id, mode: id ? 'project' : 'galaxy' }),
  setActiveTradeoff: (id) =>
    set({ activeTradeoffId: id, mode: id ? 'tradeoff' : 'galaxy' }),
  setFocus: (p) =>
    set((s) => ({ focusTarget: p, focusToken: s.focusToken + 1 })),
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
  toggleDomainExpanded: (id) =>
    set((s) => {
      const next = new Set(s.expandedDomains);
      next.has(id) ? next.delete(id) : next.add(id);
      return { expandedDomains: next };
    }),
  setShowMinimap: (b) => set({ showMinimap: b }),
  setShowLegend: (b) => set({ showLegend: b }),
  setShowHints: (b) => set({ showHints: b }),

  setFocusedSubtree: (id) => set({ focusedSubtreeId: id }),

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
