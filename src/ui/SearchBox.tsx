import { useEffect, useMemo, useRef, useState } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import type { GNode } from '../data/schema';
import { buildSearchIndex } from '../lib/search';

interface Props {
  nodes: GNode[];
  onPickNode: (id: string) => void;
}

const ACCENT = 'var(--mint)';

export default function SearchBox({ nodes, onPickNode }: Props) {
  const query = useGraphStore((s) => s.filters.query);
  const setQuery = useGraphStore((s) => s.setQuery);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
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
    <div className="relative w-[260px]">
      <div
        className="flex items-baseline gap-2.5 border-b py-1.5 transition-colors"
        style={{
          borderColor: focused ? ACCENT : 'rgba(255,255,255,0.18)',
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.06em',
            color: focused ? ACCENT : 'rgba(255,255,255,0.4)',
          }}
        >
          /
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setOpen(false), 120);
          }}
          placeholder="Search the atlas"
          className="flex-1 bg-transparent font-serif italic text-white placeholder:text-white/40 outline-none"
          style={{ fontSize: 13, letterSpacing: '0.01em' }}
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-[60vh] overflow-y-auto border bg-black/95 backdrop-blur-sm"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          {results.map((n) => (
            <button
              key={n.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onPickNode(n.id);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left transition-colors hover:bg-white/[0.04]"
            >
              <div className="truncate text-[13px] text-white">{n.name}</div>
              <div
                className="truncate font-mono text-white/45"
                style={{ fontSize: 10, letterSpacing: '0.06em' }}
              >
                {n.kind} · {n.shortExplanation}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
