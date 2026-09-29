'use client';

import React from 'react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useBranding } from '@/lib/branding/context';
import { useAuth } from '@/lib/auth/context';
import { Logo } from '@/components/ui/Logo';
import { Building2, Sparkles, ShieldCheck } from 'lucide-react';

export default function MobileAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { branding } = useBranding();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 sm:bg-slate-100 flex flex-col items-center sm:py-6 sm:px-4">
      {/* Container adapts: 100% width on mobile, sleek smartphone container on desktop */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:max-h-[920px] flex flex-col shadow-2xl sm:rounded-3xl sm:border sm:border-slate-300/80 relative overflow-x-hidden pb-20">
        {/* Offline Banner with Synced / Pending / Failed counters */}
        <OfflineBanner />

        {/* Brand & Tenant Header */}
        <header className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
          </div>

          <div className="text-right flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-800 leading-tight block truncate max-w-[120px]">
                {branding.company_name || 'Alpha Technology'}
              </span>
              <span className="text-[9px] font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 inline-block">
                H3-B24
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {user?.full_name?.slice(0, 2).toUpperCase() || 'TM'}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 p-3.5 sm:p-4 overflow-y-auto">{children}</main>

        {/* Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
