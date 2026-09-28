'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Building2, UserCheck, Shield, QrCode, ArrowRight, Zap, WifiOff, FileSpreadsheet, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
            L2
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white">lead2b</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 ml-2 px-2 py-0.5 bg-blue-950/80 border border-blue-800/60 rounded-full">
              SaaS v1.0
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
              Sign In
            </Button>
          </Link>
          <Link href="/app/dashboard">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
              Launch App
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>Built for GITEX, Trade Shows & Conferences</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.15]">
          Event Lead Capture & <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Sales Engagement</span> Platform
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Ultra-fast, mobile-first lead capture for exhibitors. Works 100% offline in crowded exhibition halls, scans visitor QR badges in 5 seconds, qualifies instantly, and syncs seamlessly with CRMs.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs font-medium text-slate-300">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <WifiOff className="w-4 h-4 text-emerald-400" /> Reliable Offline Mode (Dexie.js)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <QrCode className="w-4 h-4 text-blue-400" /> Instant Camera QR Scanning
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <Lock className="w-4 h-4 text-indigo-400" /> Multi-Tenant RLS Isolation
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Excel/CSV Export & Webhooks
          </span>
        </div>

        {/* 4 Interactive Portal Entry Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
          {/* 1. Mobile Sales Rep */}
          <Link
            href="/app/dashboard"
            className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-blue-500/40 hover:border-blue-500 shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Sales Rep PWA</span>
              <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Mobile lead capture screen. 5-second QR badge scanner, business card capture, voice notes, and offline sync.
            </p>
            <div className="mt-4 text-[11px] font-bold text-blue-400">Launch Salesperson View →</div>
          </Link>

          {/* 2. Exhibitor Admin */}
          <Link
            href="/exhibitor/dashboard"
            className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-indigo-500 shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Exhibitor Portal</span>
              <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Exhibitor dashboard, lead exports, booth team management, custom qualification forms, and CRM field mapping.
            </p>
            <div className="mt-4 text-[11px] font-bold text-indigo-400">Open Exhibitor Portal →</div>
          </Link>

          {/* 3. Event Organizer / Super Admin */}
          <Link
            href="/admin/dashboard"
            className="group relative p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 hover:border-emerald-500 shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Organizer Admin</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-2">
              Multi-event control center, halls & booths, exhibitor quotas, attendee bulk Excel import, and audit logging.
            </p>
            <div className="mt-4 text-[11px] font-bold text-emerald-400">Open Organizer Console →</div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>lead2b — Modular Monolith Architecture • Supabase PostgreSQL • Dexie.js Offline Sync Engine</p>
      </footer>
    </div>
  );
}
