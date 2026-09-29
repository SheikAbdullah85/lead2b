import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'hot' | 'warm' | 'cold' | 'urgent' | 'synced' | 'pending' | 'failed' | 'default' | 'outline' | 'vip' | 'teal';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'sm', children, ...props }: BadgeProps) {
  const variants = {
    hot: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',
    warm: 'bg-amber-50 text-amber-800 border-amber-200/80 font-semibold',
    cold: 'bg-teal-50 text-teal-800 border-teal-200/80 font-medium',
    urgent: 'bg-purple-50 text-purple-700 border-purple-200/80 font-extrabold',
    synced: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold',
    pending: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold animate-pulse',
    failed: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    vip: 'bg-gradient-to-r from-teal-700 to-cyan-700 text-white font-black tracking-wider uppercase shadow-xs',
    teal: 'bg-teal-100/70 text-teal-900 border-teal-300 font-semibold',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    outline: 'border border-slate-300 text-slate-600 bg-white/60',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 rounded-full border',
    md: 'text-xs px-3 py-1 rounded-full border',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 leading-none select-none shrink-0', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
