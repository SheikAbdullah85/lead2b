'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Building2, UserCheck, Shield, QrCode, ArrowRight, Zap, WifiOff, FileSpreadsheet, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-[#00838f] selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 px-4 sm:px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-white px-2.5 py-1.5 rounded-xl shadow-md">
            <Logo size="sm" />
          </div>
          <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-[#22d3ee] px-2 py-0.5 bg-teal-950/80 border border-teal-800/60 rounded-full">
            Commercial SaaS v1.0
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/demo">
            <Button size="sm" variant="outline" className="font-bold border-teal-500/40 text-teal-300 hover:bg-teal-950/50 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Demo Sandbox</span>
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800/70 font-bold">
              Sign In
            </Button>
          </Link>
          <Link href="/app/dashboard">
            <Button size="sm" variant="primary" className="font-extrabold shadow-lg shadow-teal-900/40 hidden sm:inline-flex">
              Open App
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center flex-1 flex flex-col items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/60 border border-teal-800/60 text-[#22d3ee] text-xs font-bold mb-6">
          <Zap className="w-3.5 h-3.5 text-[#22d3ee]" />
          <span>Built for GITEX Global, Trade Shows & Conferences</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white max-w-4xl leading-[1.12]">
          Event Lead Capture &{' '}
          <span className="bg-gradient-to-r from-[#22d3ee] via-[#00838f] to-teal-400 bg-clip-text text-transparent">
            Sales Engagement
          </span>{' '}
          Platform
        </h1>

        <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed font-normal">
          Ultra-fast, mobile-first lead capture for exhibitors. Works 100% offline in crowded exhibition venues, scans visitor badges in 5 seconds, qualifies instantly, and syncs seamlessly with any enterprise CRM.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link href="/demo">
            <Button size="lg" variant="primary" className="font-black px-6 py-3.5 shadow-xl shadow-teal-700/30 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Launch Interactive Demo Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="font-bold border-slate-700 hover:border-slate-500 text-white px-6 py-3.5 bg-slate-900/60">
              <span>Client Workspace Sign In</span>
            </Button>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mt-8 text-xs font-bold text-slate-300">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" /> Reliable Offline Mode (Dexie.js)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <QrCode className="w-3.5 h-3.5 text-[#22d3ee]" /> 5-Sec QR Badge Scanner
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <Lock className="w-3.5 h-3.5 text-cyan-400" /> PostgreSQL RLS Isolation
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" /> Excel (.xlsx) & CSV Exports
          </span>
        </div>

        {/* 3 Interactive Portal Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-left">
          {/* 1. Mobile Sales Rep */}
          <Link
            href="/app/dashboard"
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/40 hover:border-[#00838f] shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#22d3ee] border border-teal-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white flex items-center justify-between">
              <span>Sales Rep PWA</span>
              <ArrowRight className="w-4 h-4 text-[#22d3ee] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Mobile-first capture terminal. 5-second QR badge scanner, business card camera capture, voice notes, and offline sync.
            </p>
            <div className="mt-4 text-xs font-black text-[#22d3ee]">Launch Mobile PWA →</div>
          </Link>

          {/* 2. Exhibitor Admin */}
          <Link
            href="/exhibitor/dashboard"
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-teal-400 shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white flex items-center justify-between">
              <span>Exhibitor Portal</span>
              <ArrowRight className="w-4 h-4 text-teal-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Booth lead velocity analytics, Excel exports, team management, conditional form builder, and CRM field mapping.
            </p>
            <div className="mt-4 text-xs font-black text-teal-400">Open Exhibitor Console →</div>
          </Link>

          {/* 3. Event Organizer / Super Admin */}
          <Link
            href="/admin/dashboard"
            className="group relative p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-400 shadow-2xl transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white flex items-center justify-between">
              <span>Organizer Admin</span>
              <ArrowRight className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Cross-event management, halls & booths, exhibitor quotas, bulk attendee Excel imports, and security audit logs.
            </p>
            <div className="mt-4 text-xs font-black text-cyan-400">Open Organizer Suite →</div>
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
