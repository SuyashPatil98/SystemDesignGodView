import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode } from '../data/schema';
import { buildSearchIndex } from '../lib/search';

interface Props {
  nodes: GNode[];
  onPickNode: (id: string) => void;
}

export default function SearchBox({ nodes, onPickNode }: Props) {
  const query = useGraphStore((s) => s.filters.query);
  const setQuery = useGraphStore((s) => s.setQuery);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(() => buildSearchIndex(nodes), [nodes]);
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    return fuse.search(query, { limit: 8 }).map((r) => r.item);
  }, [query, fuse]);

  // Global "/" shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement)?.matches?.('input,textarea')) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="relative w-[420px] max-w-[44vw]">
      <div className="glass-soft flex items-center gap-2 rounded-full px-3 py-2">
        <Search size={14} className="text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Search concepts, tools, failure modes…"
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="text-slate-500 hover:text-slate-200"
          >
            <X size={14} />
          </button>
        )}
        <kbd className="kbd">/</kbd>
      </div>

      {open && results.length > 0 && (
        <div className="glass absolute left-0 right-0 top-full z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-xl p-1">
          {results.map((n) => (
            <button
              key={n.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPickNode(n.id);
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5"
            >
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-cyan-300/80" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-100">
                  {n.name}
                </div>
                <div className="truncate text-[11px] text-slate-400">
                  {n.kind} · {n.shortExplanation}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
