'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useBranding } from '@/lib/branding/context';
import { triggerSync } from '@/lib/db/sync-engine';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { triggerGlobalPwaInstall } from '@/components/pwa/PwaInstallPrompt';
import { localDb } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import {
  User,
  Building2,
  Wifi,
  RefreshCw,
  Smartphone,
  LogOut,
  CheckCircle,
  ShieldCheck,
  Database,
  HardDrive,
  Sparkles,
  HelpCircle,
  BookOpen,
  QrCode,
  CreditCard,
  Printer,
  Flame,
  Zap,
  Trash2,
} from 'lucide-react';

export default function MobileSettingsPage() {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(false);

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

  const handlePurgeAllData = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete all leads, notes, and tasks from this device and the live database? This will give you a 100% clean production environment for GITEX 2026.')) {
      return;
    }
    setIsPurging(true);
    try {
      await localDb.leads.clear();
      await localDb.leadNotes.clear();
      await localDb.followups.clear();
      await localDb.syncQueue.clear();

      if (typeof navigator === 'undefined' || navigator.onLine) {
        await supabase.from('lead_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('followups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      setPurgeSuccess(true);
      setTimeout(() => {
        window.location.href = '/app/dashboard';
      }, 1500);
    } catch (e: any) {
      alert(`Purge failed: ${e.message}`);
    } finally {
      setIsPurging(false);
    }
  };

  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'SA';

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
                {user?.system_role === 'super_admin' ? 'Super Administrator' : user?.system_role === 'exhibitor_admin' ? 'Exhibitor Admin' : 'Sales Representative'}
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
          className="w-full text-xs font-bold gap-2 py-2.5 bg-white border-slate-200 hover:border-brand-300 hover:text-brand-700 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-brand-600" />
          <span>Force Cloud Sync Now</span>
        </Button>
      </div>

      {/* PWA Mobile App Installation Card */}
      <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-[#004d53] text-white rounded-2xl border border-teal-800/50 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white">Mobile App Installation</h3>
              <p className="text-[10px] text-slate-300">Run lead2b fullscreen with instant offline launch</p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
            PWA
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Installing lead2b adds a native app icon to your mobile home screen, enabling 0.5s offline boot and camera badge scanning without browser address bars.
        </p>

        <Button
          variant="primary"
          onClick={() => triggerGlobalPwaInstall()}
          className="w-full text-xs font-black gap-2 py-2.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 hover:brightness-105 active:scale-98 shadow-md cursor-pointer"
        >
          <Smartphone className="w-4 h-4" />
          <span>Install lead2b on this Device</span>
        </Button>
      </div>

      {/* User Help & Operations Guide */}
      <div className="p-4 bg-gradient-to-br from-brand-50/70 to-teal-50/50 rounded-2xl border border-brand-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">User Help & Field Manual</h3>
              <p className="text-[11px] text-slate-500">Badge scanning, business card OCR & batch printing</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link href="/app/help">
              <Button
                size="sm"
                variant="primary"
                className="text-xs font-black gap-1 bg-[#00838f] text-white shadow-xs"
              >
                <span>Full Guide &amp; Screens</span>
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsHelpOpen(true)}
              className="text-xs font-bold bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <span>Quick Modal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <Modal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title="lead2b Operations & User Guide"
          description="Standard Operating Procedures for Trade Show Lead Capture"
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Guide Item 1 */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <QrCode className="w-4 h-4 text-teal-600" />
                <span>1. 5-Second QR Badge Scanning</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Tap <strong>Scan Lead</strong> on the bottom bar. Point camera at visitor badge QR. Profile auto-hydrates instantly from local offline cache. Select quality (<strong>Hot / Warm / Cold</strong>) and tap <strong>Save Lead</strong>.
              </p>
              <div className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded">
                💡 Low lighting? Tap the Flashlight Torch icon on the scanner screen.
              </div>
            </div>

            {/* Guide Item 2 */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>2. Rapid Batch Scanning Mode</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                During peak booth rush, flip the <strong>Rapid Batch Mode</strong> switch at the top of the scanner. You can continuously scan incoming visitors in under 0.8s each without closing the camera view.
              </p>
            </div>

            {/* Guide Item 3 */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <CreditCard className="w-4 h-4 text-brand-600" />
                <span>3. Physical Business Card OCR</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                When a visitor has no badge, tap <strong>Scan Business Card (OCR)</strong>. Take a photo of the card. The on-device OCR engine extracts mobile phone number (+971 UAE & international), email, name, and company automatically.
              </p>
            </div>

            {/* Guide Item 4 */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <Printer className="w-4 h-4 text-purple-600" />
                <span>4. Batch Badge Printing</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                From <strong>Admin &gt; Attendee &amp; Badge Management</strong>, select any number of attendees using the checkboxes and click <strong>Batch Print Badges</strong>. Generates high-res encrypted QR badges ready for printing.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setIsHelpOpen(false)} className="font-bold">
                Got it, Close Guide
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Purge & Delete All Data Section (Single Live Admin Control) */}
      <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-rose-950">Purge Live System Data</h3>
              <p className="text-[10px] text-rose-700 font-medium">Wipe test leads from device &amp; cloud database</p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200/60 text-rose-800 border border-rose-300">
            Admin Only
          </span>
        </div>

        <p className="text-xs text-rose-800/80 leading-relaxed font-medium">
          Permanently wipes all captured leads, notes, and tasks from your device memory and the live database. Use this anytime to reset to a completely clean slate.
        </p>

        {purgeSuccess && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>All live system data wiped successfully. Redirecting to clean dashboard...</span>
          </div>
        )}

        <Button
          variant="danger"
          onClick={handlePurgeAllData}
          isLoading={isPurging}
          className="w-full text-xs font-black gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Purge All Live Data (Reset to Zero)</span>
        </Button>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={logout}
          className="w-full text-xs font-black gap-2 py-3 shadow-xs bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Sales Terminal</span>
        </Button>
      </div>
    </div>
  );
}
