'use client';

import React from 'react';
import Link from 'next/link';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useBranding } from '@/lib/branding/context';
import { useAuth } from '@/lib/auth/context';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Logo } from '@/components/ui/Logo';
import { Building2, Sparkles, ShieldCheck, Shield, ExternalLink } from 'lucide-react';

export default function MobileAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { branding } = useBranding();
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-900 sm:bg-slate-100 flex flex-col items-center sm:py-6 sm:px-4">
      {/* Container adapts: 100% width on mobile, sleek smartphone container on desktop */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:max-h-[920px] flex flex-col shadow-2xl sm:rounded-3xl sm:border sm:border-slate-300/80 relative overflow-x-hidden pb-20">
        {/* Offline Banner with Synced / Pending / Failed counters */}
        <OfflineBanner />

        {/* Super Administrator Master Portal Switcher Bar */}
        {user?.system_role === 'super_admin' && (
          <div className="bg-slate-950 text-white px-3 py-1.5 flex items-center justify-between border-b border-slate-800 text-[11px] z-20 shrink-0">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">Master Access:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href="/exhibitor/dashboard"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-300 border border-teal-700/50 hover:border-teal-500 font-bold transition text-[10px]"
                title="Open Exhibitor Web Portal"
              >
                <Building2 className="w-3 h-3 text-teal-400" />
                <span>Exhibitor</span>
              </Link>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 hover:border-indigo-500 font-bold transition text-[10px]"
                title="Open Organizer Admin Portal"
              >
                <Shield className="w-3 h-3 text-indigo-400" />
                <span>Organizer</span>
              </Link>
            </div>
          </div>
        )}

        {/* Brand & Tenant Header */}
        <header className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
          </div>

          <div className="text-right flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-800 leading-tight block truncate max-w-[130px]">
                {branding.company_name || (user?.email === 'sheik85@gmail.com' ? 'acSys IT Solutions' : 'Lead Capture')}
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[9px] font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60 inline-block">
                  H3-B24
                </span>
                {user?.system_role === 'super_admin' && (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                    Admin
                  </span>
                )}
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
              {user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'SA'}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 p-3.5 sm:p-4 overflow-y-auto">{children}</main>

        {/* Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
    </AuthGuard>
  );
}
