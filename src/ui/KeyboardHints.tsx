import { Keyboard, X } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';

const hints: [string, string][] = [
  ['/', 'Search'],
  ['Esc', 'Clear selection'],
  ['F', 'Re-focus selected'],
  ['C', 'Reset camera'],
  ['1-8', 'Switch mode'],
  ['M', 'Toggle minimap'],
];

export default function KeyboardHints() {
  const show = useGraphStore((s) => s.showHints);
  const setShow = useGraphStore((s) => s.setShowHints);
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="pointer-events-auto absolute bottom-5 right-5 z-10 flex items-center gap-1.5 rounded-md border border-white/10 bg-ink-900/80 px-2.5 py-1.5 text-[11px] text-slate-300 hover:bg-ink-800"
      >
        <Keyboard size={12} /> Shortcuts
      </button>
    );
  }
  return (
    <div className="glass pointer-events-auto absolute bottom-5 right-5 z-10 flex items-center gap-3 rounded-xl px-3 py-2">
      <Keyboard size={12} className="text-cyan-300" />
      <div className="flex items-center gap-2 text-[11px] text-slate-300">
        {hints.map(([k, label]) => (
          <span key={k} className="flex items-center gap-1">
            <kbd className="kbd">{k}</kbd>
            <span className="text-slate-400">{label}</span>
          </span>
        ))}
      </div>
      <button
        onClick={() => setShow(false)}
        className="text-slate-500 hover:text-slate-200"
      >
        <X size={12} />
      </button>
    </div>
  );
}
