'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, QrCode, CalendarCheck, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/app/dashboard', icon: Home },
    { label: 'Leads', href: '/app/leads', icon: Users },
    // Scan button is center action
    { label: 'Scan', href: '/app/scan', icon: QrCode, isPrimary: true },
    { label: 'Tasks', href: '/app/followups', icon: CalendarCheck },
    { label: 'More', href: '/app/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 shadow-lg select-none">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex flex-col items-center group active:scale-95 transition"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 shadow-xl shadow-blue-500/40 flex items-center justify-center text-white ring-4 ring-white group-hover:scale-105 transition-all">
                  <QrCode className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-blue-600 mt-1 uppercase tracking-wider">
                  Scan Lead
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center py-1 px-3 rounded-xl transition duration-150',
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', isActive ? 'stroke-[2.4]' : 'stroke-[1.8]')} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
