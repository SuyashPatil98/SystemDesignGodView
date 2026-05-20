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
  ['M', 'Toggle minimap'],
];

const mouseRows: [string, string][] = [
  ['Left drag', 'Orbit'],
  ['Right drag', 'Pan'],
  ['Wheel', 'Zoom'],
];

export default function KeyboardHints() {
  const show = useGraphStore((s) => s.showHints);
  const setShow = useGraphStore((s) => s.setShowHints);
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="pointer-events-auto absolute bottom-5 right-5 z-10 hidden md:flex items-center gap-1.5 rounded-md border border-white/10 bg-ink-900/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-ink-800"
      >
        <Keyboard size={12} /> Controls
      </button>
    );
  }
  return (
    <div className="glass pointer-events-auto absolute bottom-5 right-5 z-10 hidden md:block max-w-[460px] rounded-xl px-3.5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          Controls
        </span>
        <button
          onClick={() => setShow(false)}
          className="text-slate-500 hover:text-slate-200"
        >
          <X size={12} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
        {/* Movement */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cyan-300">
            <Keyboard size={11} /> Move
          </div>
          {movement.map(([k, l]) => (
            <div key={k} className="flex items-center justify-between gap-2 py-0.5 text-[11px] text-slate-300">
              <kbd className="kbd">{k}</kbd>
              <span className="text-slate-400">{l}</span>
            </div>
          ))}
        </div>

        {/* Mouse */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-300">
            <Mouse size={11} /> Look
          </div>
          {mouseRows.map(([k, l]) => (
            <div key={k} className="flex items-center justify-between gap-2 py-0.5 text-[11px] text-slate-300">
              <span className="text-slate-200">{k}</span>
              <span className="text-slate-400">{l}</span>
            </div>
          ))}
        </div>

        {/* Shortcuts */}
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-300">
            <Keyboard size={11} /> Shortcuts
          </div>
          {shortcuts.map(([k, l]) => (
            <div key={k} className="flex items-center justify-between gap-2 py-0.5 text-[11px] text-slate-300">
              <kbd className="kbd">{k}</kbd>
              <span className="text-slate-400">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
