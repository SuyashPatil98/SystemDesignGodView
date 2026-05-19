import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: 'default' | 'warn' | 'good';
  count?: number;
}

const toneStyles: Record<string, string> = {
  default: 'text-slate-200',
  warn: 'text-amber-200',
  good: 'text-emerald-200',
};

export default function Section({
  title,
  children,
  defaultOpen = true,
  tone = 'default',
  count,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-white/5 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneStyles[tone]}`}
        >
          {title}
          {typeof count === 'number' && count > 0 && (
            <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="pb-3 text-sm text-slate-300">{children}</div>}
    </div>
  );
}
