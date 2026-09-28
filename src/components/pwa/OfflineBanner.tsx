'use client';

import React, { useState, useEffect } from 'react';
import { subscribeToSyncStats, triggerSync, SyncStats } from '@/lib/db/sync-engine';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export function OfflineBanner() {
  const [stats, setStats] = useState<SyncStats>({
    synced: 0,
    pending: 0,
    failed: 0,
    isOnline: true,
    isSyncing: false,
    lastSyncTime: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeToSyncStats(setStats);
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    await triggerSync();
  };

  return (
    <div className="w-full bg-slate-900 text-slate-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 select-none">
      {/* Network Status Indicator */}
      <div className="flex items-center gap-2">
        {stats.isOnline ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5" />
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Offline Mode Active</span>
          </div>
        )}
      </div>

      {/* Synchronized Counters strictly as requested by prompt */}
      <div className="flex items-center gap-3 font-medium">
        <span className="inline-flex items-center gap-1 text-emerald-400">
          <CheckCircle className="w-3 h-3" />
          <span>Synced: <strong>{stats.synced}</strong></span>
        </span>
        <span className={`inline-flex items-center gap-1 ${stats.pending > 0 ? 'text-amber-400 animate-pulse font-bold' : 'text-slate-400'}`}>
          <RefreshCw className={`w-3 h-3 ${stats.isSyncing ? 'animate-spin' : ''}`} />
          <span>Pending: <strong>{stats.pending}</strong></span>
        </span>
        {stats.failed > 0 && (
          <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed: <strong>{stats.failed}</strong></span>
          </span>
        )}
      </div>

      {/* Manual Sync Trigger */}
      <button
        onClick={handleManualSync}
        disabled={stats.isSyncing || !stats.isOnline}
        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-semibold transition disabled:opacity-40"
        title="Trigger manual cloud sync"
      >
        <RefreshCw className={`w-3 h-3 ${stats.isSyncing ? 'animate-spin text-blue-400' : ''}`} />
        <span>{stats.isSyncing ? 'Syncing...' : 'Sync Now'}</span>
      </button>
    </div>
  );
}
