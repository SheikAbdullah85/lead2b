import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'hot' | 'warm' | 'cold' | 'urgent' | 'synced' | 'pending' | 'failed' | 'default' | 'outline' | 'vip';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    hot: 'bg-red-100 text-red-700 border-red-200 font-bold',
    warm: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold',
    cold: 'bg-sky-100 text-sky-700 border-sky-200',
    urgent: 'bg-purple-100 text-purple-700 border-purple-200 font-bold',
    synced: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse',
    failed: 'bg-rose-100 text-rose-800 border-rose-300',
    vip: 'bg-indigo-600 text-white font-bold tracking-wide uppercase',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'border border-slate-300 text-slate-600 bg-transparent',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full border',
    md: 'text-xs px-2.5 py-1 rounded-full border',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none select-none', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
