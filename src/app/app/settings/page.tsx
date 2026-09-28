'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { useBranding } from '@/lib/branding/context';
import { triggerSync } from '@/lib/db/sync-engine';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { User, Building2, Wifi, RefreshCw, Smartphone, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';

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
      setSyncMessage(`Sync completed. ${res.syncedCount} items synchronized.`);
    } catch (e: any) {
      setSyncMessage('Sync failed. Please verify internet connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div>
        <h2 className="text-lg font-black text-slate-900 leading-none">Settings & Sync</h2>
        <p className="text-xs text-slate-500 mt-0.5">Profile, Offline Storage & Diagnostics</p>
      </div>

      {/* User & Booth Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            {user?.full_name?.slice(0, 2).toUpperCase() || 'TM'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{user?.full_name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Sales Representative
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                Booth H3-B24
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{branding.company_name}</span>
          </span>
          <span className="font-semibold text-slate-700">GITEX Global 2026</span>
        </div>
      </div>

      {/* Offline Storage & Sync Diagnostics */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-blue-600" />
          <span>Offline Database & Sync Engine</span>
        </h3>
        <p className="text-xs text-slate-500">
          lead2b stores leads locally in high-speed IndexedDB using Dexie.js so you can capture leads continuously without waiting for event Wi-Fi.
        </p>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Storage Engine:</span>
            <span className="font-mono font-semibold text-slate-800">IndexedDB (Dexie 4.0)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Idempotency Protection:</span>
            <span className="font-semibold text-emerald-600">Enabled (UUID Keys)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">PWA Offline Cache:</span>
            <span className="font-semibold text-blue-600">Active (Service Worker)</span>
          </div>
        </div>

        {syncMessage && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        <Button
          variant="outline"
          onClick={handleManualSync}
          isLoading={isSyncing}
          className="w-full text-xs font-bold gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          <span>Force Cloud Sync Now</span>
        </Button>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <Button
          variant="danger"
          onClick={logout}
          className="w-full text-xs font-bold gap-2 py-3"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
