'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useBranding } from '@/lib/branding/context';
import { triggerSync } from '@/lib/db/sync-engine';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { User, Building2, Wifi, RefreshCw, Smartphone, LogOut, CheckCircle, ShieldCheck, Database, HardDrive, Sparkles } from 'lucide-react';

export default function MobileSettingsPage() {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await triggerSync();
      setSyncMessage(`Sync completed. ${res.syncedCount} items synchronized with cloud.`);
    } catch (e: any) {
      setSyncMessage('Sync failed. Please verify internet connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const initials = user?.full_name?.slice(0, 2).toUpperCase() || 'TM';

  return (
    <div className="space-y-4 pb-12">
      <div>
        <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-500" />
          Hardware & Diagnostics
        </span>
        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Settings & Engine</h2>
      </div>

      {/* User & Booth Profile Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white font-black text-lg flex items-center justify-center shadow-sm ring-4 ring-brand-50 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-black text-slate-900 truncate">{user?.full_name}</h3>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 border border-brand-200/60">
                Sales Representative
              </span>
              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                Booth H3-B24
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{branding.company_name}</span>
          </span>
          <span className="font-bold text-slate-800 shrink-0">GITEX Global 2026</span>
        </div>
      </div>

      {/* Offline Storage Engine & PWA Health */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-600" />
            <span>Offline Engine Status</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Engine Ready
          </span>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          lead2b stores leads locally in high-speed IndexedDB using Dexie.js so you can capture leads continuously without waiting for event Wi-Fi.
        </p>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Storage Engine:</span>
            <span className="font-mono font-bold text-slate-800">IndexedDB (Dexie 4.0)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Idempotency Protection:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              UUID V4 Keys
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">PWA Offline Cache:</span>
            <span className="font-bold text-brand-700">Active (Service Worker)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Audio Memos Format:</span>
            <span className="font-mono font-bold text-slate-700">WebM / Opus</span>
          </div>
        </div>

        {syncMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        <Button
          variant="outline"
          onClick={handleManualSync}
          isLoading={isSyncing}
          className="w-full text-xs font-bold gap-2 py-2.5 bg-white border-slate-200 hover:border-brand-300 hover:text-brand-700"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
          <span>Force Cloud Sync Now</span>
        </Button>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <Button
          variant="danger"
          onClick={logout}
          className="w-full text-xs font-black gap-2 py-3 shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Sales Terminal</span>
        </Button>
      </div>
    </div>
  );
}
