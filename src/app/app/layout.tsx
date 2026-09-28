'use client';

import React from 'react';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useBranding } from '@/lib/branding/context';
import { useAuth } from '@/lib/auth/context';
import Link from 'next/link';
import { Building2, Sparkles } from 'lucide-react';

export default function MobileAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { branding } = useBranding();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      {/* Container restricted to mobile width on larger screens for realistic PWA experience */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl relative pb-24">
        {/* Offline Banner with Synced / Pending / Failed counters */}
        <OfflineBanner />

        {/* Tenant Header with dynamic branding */}
        <header className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm"
              style={{ backgroundColor: branding.primary_color || '#2563eb' }}
            >
              {branding.company_name?.slice(0, 2).toUpperCase() || 'L2'}
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-none">
                {branding.company_name || 'Alpha Technology Group'}
              </h1>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                <span>GITEX Global 2026</span>
                <span>•</span>
                <span className="font-semibold text-slate-600">Booth H3-B24</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              {user?.full_name?.split(' ')[0] || 'Tariq'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4">{children}</main>

        {/* Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
