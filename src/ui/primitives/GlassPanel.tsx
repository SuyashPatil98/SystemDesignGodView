import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function GlassPanel({ children, className = '' }: Props) {
  return (
    <div
      className={`glass rounded-2xl text-slate-100 shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
