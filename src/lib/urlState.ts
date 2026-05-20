// URL deep-link state.
//
//   ?n=<nodeId>    selected node
//   ?m=<mode>      mode
//   ?f=<id>        focused subtree id
//   ?p=<id>        active learning path
//   ?pr=<id>       active project
//   ?to=<id>       active tradeoff
//
// Only writes when a value differs from the URL — quiet on idle.

import type { Mode } from '../data/schema';

export interface UrlState {
  selectedId: string | null;
  mode: Mode | null;
  focusedSubtreeId: string | null;
  activePathId: string | null;
  activeProjectId: string | null;
  activeTradeoffId: string | null;
}

const VALID_MODES: Mode[] = [
  'galaxy',
  'learning-path',
  'project',
  'tradeoff',
  'failure-mode',
  'metric',
  'pattern',
  'tool',
];

export function parseUrl(search: string = window.location.search): UrlState {
  const p = new URLSearchParams(search);
  const m = p.get('m');
  return {
    selectedId: p.get('n'),
    mode: m && (VALID_MODES as string[]).includes(m) ? (m as Mode) : null,
    focusedSubtreeId: p.get('f'),
    activePathId: p.get('p'),
    activeProjectId: p.get('pr'),
    activeTradeoffId: p.get('to'),
  };
}

export function buildUrl(state: Partial<UrlState>): string {
  const p = new URLSearchParams();
  if (state.selectedId) p.set('n', state.selectedId);
  if (state.mode && state.mode !== 'galaxy') p.set('m', state.mode);
  if (state.focusedSubtreeId) p.set('f', state.focusedSubtreeId);
  if (state.activePathId) p.set('p', state.activePathId);
  if (state.activeProjectId) p.set('pr', state.activeProjectId);
  if (state.activeTradeoffId) p.set('to', state.activeTradeoffId);
  const qs = p.toString();
  return qs ? `?${qs}` : window.location.pathname;
}

export function replaceUrl(state: Partial<UrlState>) {
  const url = buildUrl(state);
  // Only push if different.
  const current = window.location.search || window.location.pathname;
  if (current === url) return;
  window.history.replaceState({}, '', url);
}

export function shareableUrl(state: Partial<UrlState>): string {
  return window.location.origin + window.location.pathname + buildUrl(state);
}
