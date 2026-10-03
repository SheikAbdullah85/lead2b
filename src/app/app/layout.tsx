'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { OfflineBanner } from '@/components/pwa/OfflineBanner';
import { useBranding } from '@/lib/branding/context';
import { useAuth } from '@/lib/auth/context';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Logo } from '@/components/ui/Logo';
import { Building2, Sparkles, ShieldCheck, Shield, ExternalLink, LogOut, ArrowRight } from 'lucide-react';

export default function MobileAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { branding } = useBranding();
  const { user, logout, isDemoMode } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
      router.push('/login');
    }
  };

  const handleSwitchToLive = () => {
    logout();
    router.push('/login');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-900 sm:bg-slate-100 flex flex-col items-center sm:py-6 sm:px-4">
        {/* Container adapts: 100% width on mobile, sleek smartphone container on desktop */}
        <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:max-h-[920px] flex flex-col shadow-2xl sm:rounded-3xl sm:border sm:border-slate-300/80 relative overflow-x-hidden pb-20">
          {/* Offline Banner with Synced / Pending / Failed counters */}
          <OfflineBanner />

          {/* Demo Sandbox Alert & Switch to Live Action Banner */}
          {isDemoMode && (
            <div className="bg-amber-500 text-slate-950 px-3 py-1.5 flex items-center justify-between text-[11px] font-black z-20 shrink-0 border-b border-amber-600 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                <span>Demo Environment Active</span>
              </div>
              <button
                type="button"
                onClick={handleSwitchToLive}
                className="px-2 py-0.5 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-900 text-[10px] font-black flex items-center gap-1 transition"
              >
                <span>Switch to Live App</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Super Administrator Master Portal Switcher Bar (Single Instance) */}
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

          {/* Brand & Tenant Header with Logout option */}
          <header className="px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              {!isDemoMode && (
                <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  LIVE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-800 leading-tight block truncate max-w-[120px]">
                  {branding.company_name || (user?.email === 'sheik85@gmail.com' ? 'acSys IT Solutions' : 'Lead Capture')}
                </span>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span className="text-[9px] font-mono font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60 inline-block">
                    Stand H3-B24
                  </span>
                </div>
              </div>

              {/* User Avatar */}
              <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                {user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'SA'}
              </div>

              {/* Header Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95 transition"
                title="Sign Out / Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
