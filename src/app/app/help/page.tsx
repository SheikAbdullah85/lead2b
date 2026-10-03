'use client';

import React from 'react';
import Link from 'next/link';
import {
  QrCode,
  CreditCard,
  UserPlus,
  Mic,
  WifiOff,
  Download,
  Smartphone,
  CheckCircle2,
  Trash2,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Flame,
  FileSpreadsheet,
  Zap,
  Building2,
  User,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getActiveEvent, getActiveTenant } from '@/lib/events/active-event';

export default function AppHelpPage() {
  const activeEvent = getActiveEvent();
  const activeTenant = getActiveTenant();

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <Link href="/app/settings" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-xl transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00838f] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00838f]" />
            Field Operations Manual
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">User Help Guide &amp; Screens</h1>
        </div>
      </div>

      {/* Intro Overview */}
      <div className="p-4 bg-gradient-to-br from-teal-950 via-slate-900 to-[#004d53] text-white rounded-2xl border border-teal-800/40 shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#22d3ee]/20 text-[#22d3ee] border border-[#22d3ee]/30">
            {activeEvent.name}
          </span>
          <span className="text-xs font-bold text-slate-300">{activeTenant.stand || 'Stand TK-01'}</span>
        </div>
        <h2 className="text-base font-black text-white leading-snug">
          How to Capture &amp; Qualify Every Visitor in Under 10 Seconds
        </h2>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal">
          Designed specifically for crowded trade shows where event organizer visitor APIs are not accessible. Capture badges via OCR, scan business cards, or dictate notes hands-free with voice.
        </p>
      </div>

      {/* Screen 1: Dashboard with 3 Hero Options */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-50 text-teal-800 border border-teal-200">
            Screen 1 • Home Dashboard
          </span>
          <span className="text-[11px] font-mono text-slate-400">/app/dashboard</span>
        </div>

        <h3 className="text-sm font-black text-slate-900">3 Instant Capture Options</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          From the top of your home screen, you have 3 equal-stature hero action buttons tailored for every visitor scenario:
        </p>

        {/* Visual Mockup */}
        <div className="p-3 bg-slate-950 text-white rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
          <div className="text-[10px] text-[#22d3ee] uppercase font-bold tracking-wider">Visual Interface:</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-gradient-to-b from-teal-900/60 to-slate-900 rounded-lg border border-teal-500/40">
              <QrCode className="w-5 h-5 mx-auto text-cyan-300 mb-1" />
              <div className="font-bold text-[10px] text-white">Scan Badge</div>
              <div className="text-[8px] text-slate-400">QR &amp; Photo OCR</div>
            </div>
            <div className="p-2.5 bg-gradient-to-b from-teal-900/60 to-slate-900 rounded-lg border border-teal-500/40">
              <CreditCard className="w-5 h-5 mx-auto text-emerald-300 mb-1" />
              <div className="font-bold text-[10px] text-white">Business Card</div>
              <div className="text-[8px] text-slate-400">Mobile &amp; Email OCR</div>
            </div>
            <div className="p-2.5 bg-gradient-to-b from-teal-900/60 to-slate-900 rounded-lg border border-teal-500/40">
              <UserPlus className="w-5 h-5 mx-auto text-amber-300 mb-1" />
              <div className="font-bold text-[10px] text-white">Manual Feed</div>
              <div className="text-[8px] text-slate-400">Direct Entry</div>
            </div>
          </div>
        </div>

        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
          <li><strong>Option 1 (Scan Badge):</strong> Opens camera for 5-second QR scan or physical lanyard badge photo OCR.</li>
          <li><strong>Option 2 (Business Card):</strong> Takes a photo of physical business cards and extracts name, phone (+971 UAE/international), company, and email.</li>
          <li><strong>Option 3 (Manual Feed):</strong> Quick form when talking to walk-up visitors without paper cards.</li>
        </ul>
      </div>

      {/* Screen 2: Badge OCR Scanner */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-50 text-cyan-800 border border-cyan-200">
            Screen 2 • Badge OCR &amp; QR
          </span>
          <span className="text-[11px] font-mono text-slate-400">/app/scan</span>
        </div>

        <h3 className="text-sm font-black text-slate-900">Overcoming Inaccessible Visitor Badge APIs</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          When the exhibition organizer doesn't grant API access to badge databases, lead2b uses on-device neural text detection:
        </p>

        {/* Visual Mockup */}
        <div className="p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400">
            <span>[CAMERA BADGE OCR SCREEN]</span>
            <span>Torch Light [ON]</span>
          </div>
          <div className="h-28 border-2 border-dashed border-cyan-400/80 rounded-lg flex flex-col items-center justify-center p-3 text-center bg-slate-950/70 relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              ALIGN VISITOR LANYARD BADGE HERE
            </span>
            <div className="mt-2 text-[9px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              ✓ Detected: Sheik Abdullah • acSys IT Solutions
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>• Rapid Batch Switch: 0.8s Continuous</span>
            <span>• Flashlight Assist</span>
          </div>
        </div>

        <div className="p-2.5 bg-cyan-50/70 border border-cyan-200/80 rounded-xl text-xs text-cyan-950 font-medium">
          💡 <strong>Rapid Batch Mode:</strong> During peak rush hours (11 AM - 3 PM), switch on "Rapid Batch Mode" at top of screen to scan lanyards consecutively without leaving camera view.
        </div>
      </div>

      {/* Screen 3: Business Card Scanner */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            Screen 3 • Card OCR
          </span>
          <span className="text-[11px] font-mono text-slate-400">/app/scan/card</span>
        </div>

        <h3 className="text-sm font-black text-slate-900">Physical Business Card Capture</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Snap a picture of any paper business card. The contrast-boost preprocessor parses text with high precision:
        </p>

        {/* Visual Mockup */}
        <div className="p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold">NAME:</span>
              <span className="text-white font-bold">Ahamed Jameel</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold">COMPANY:</span>
              <span className="text-white font-bold">ARISTO STAR LLC</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold">PHONE:</span>
              <span className="text-emerald-400 font-bold">+971 50 123 4567 (UAE Mobile)</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-slate-400 font-bold">EMAIL:</span>
              <span className="text-cyan-300 font-bold">jameel@aristostar.com</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          All fields automatically flow directly into the editable Qualification form, with remaining details ready for instant review.
        </p>
      </div>

      {/* Screen 4: 1-Tap Voice to Fill Form */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-800 border border-purple-200">
            Screen 4 • Quick Qualify &amp; Voice
          </span>
          <span className="text-[11px] font-mono text-slate-400">Modal Flow</span>
        </div>

        <h3 className="text-sm font-black text-slate-900">Editable Fields + Hands-Free Voice Dictation</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          All visitor contact fields remain directly editable. For high-speed qualification, tap the <strong>Voice to Fill Form</strong> button:
        </p>

        {/* Visual Mockup */}
        <div className="p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-center p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl gap-2">
            <Mic className="w-5 h-5 text-purple-300 animate-pulse" />
            <span className="font-bold text-purple-200 text-xs">1-Tap Voice to Fill Form (Listening...)</span>
          </div>
          <p className="text-[11px] text-slate-300 italic text-center">
            &ldquo;Hot lead, John from Siemens interested in Enterprise AI for 3 months, mobile 050 999 8888&rdquo;
          </p>
          <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] space-y-0.5 text-emerald-400">
            <div>✓ Rating: HOT (Urgent 🔥)</div>
            <div>✓ Product: Enterprise AI Platform</div>
            <div>✓ Timeline: 1-3 months</div>
            <div>✓ Mobile: +971 50 999 8888</div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Select digital brochures or whitepapers to dispatch instantly to the visitor&apos;s email address upon saving.
        </p>
      </div>

      {/* Screen 5: Offline Mode & PWA */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
            Screen 5 • Reliability Engine
          </span>
          <span className="text-[11px] font-mono text-slate-400">IndexedDB Dexie</span>
        </div>

        <h3 className="text-sm font-black text-slate-900">Zero Internet Required in Exhibition Halls</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Convention centers frequently have congested cellular networks. lead2b operates 100% offline using local IndexedDB:
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <span className="font-black text-emerald-900 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              While Offline
            </span>
            <p className="text-[11px] text-emerald-800">
              Captures are instantly saved locally in &lt;100ms. Green/Yellow indicator shows pending count.
            </p>
          </div>
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
            <span className="font-black text-teal-900 flex items-center gap-1">
              <Zap className="w-4 h-4 text-teal-600" />
              When Online
            </span>
            <p className="text-[11px] text-teal-800">
              Background sync engine flushes all leads to PostgreSQL with UUID idempotency (no duplicates).
            </p>
          </div>
        </div>
      </div>

      {/* Screen 6: Purge & Reset Control */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-200">
            Screen 6 • Administrator Control
          </span>
          <span className="text-[11px] font-mono text-slate-400">/app/settings</span>
        </div>

        <h3 className="text-sm font-black text-slate-900">Single Authorized User &amp; Zero-Reset Button</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The production system is restricted exclusively to <strong>sheik85@gmail.com</strong> (Password: <code>Craftix@2026</code>).
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>One-Tap Purge Live Data:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Located in <strong>Settings &gt; Purge Live System Data</strong>. Wipes all test leads from your phone browser and the live PostgreSQL database in 1 second whenever you wish to restart with zero records.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
        <Link href="/app/dashboard" className="w-full sm:flex-1">
          <Button variant="primary" size="lg" className="w-full font-black text-xs py-3 shadow-md">
            <span>Back to Capture Dashboard</span>
          </Button>
        </Link>
        <Link href="/app/settings" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full sm:w-auto font-bold text-xs py-3 bg-white">
            <span>Settings &amp; Engine</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
