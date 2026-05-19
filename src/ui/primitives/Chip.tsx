import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  tone?: 'cyan' | 'violet' | 'rose' | 'amber' | 'emerald' | 'slate';
  size?: 'sm' | 'md';
}

const toneActive: Record<string, string> = {
  cyan: 'border-cyan-300/70 text-cyan-100 bg-cyan-500/15 shadow-[0_0_18px_rgba(34,211,238,0.25)]',
  violet:
    'border-violet-300/70 text-violet-100 bg-violet-500/15 shadow-[0_0_18px_rgba(167,139,250,0.25)]',
  rose: 'border-rose-300/70 text-rose-100 bg-rose-500/15 shadow-[0_0_18px_rgba(251,113,133,0.25)]',
  amber:
    'border-amber-300/70 text-amber-100 bg-amber-500/15 shadow-[0_0_18px_rgba(251,191,36,0.25)]',
  emerald:
    'border-emerald-300/70 text-emerald-100 bg-emerald-500/15 shadow-[0_0_18px_rgba(52,211,153,0.25)]',
  slate: 'border-slate-300/40 text-slate-100 bg-slate-500/15',
};

export default function Chip({
  children,
  active,
  onClick,
  className = '',
  tone = 'cyan',
  size = 'sm',
}: Props) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full border transition-all duration-150 whitespace-nowrap';
  const sizing =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-1 font-medium'
      : 'text-xs px-3 py-1.5 font-semibold';
  const idle =
    'border-white/10 text-slate-300 bg-white/[0.02] hover:border-white/25 hover:text-white';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${sizing} ${active ? toneActive[tone] : idle} ${className}`}
    >
      {children}
    </button>
  );
}
