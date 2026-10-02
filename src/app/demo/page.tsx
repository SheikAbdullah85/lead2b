'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_USERS, DEFAULT_CREDENTIALS } from '@/lib/auth/context';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import {
  Smartphone,
  Building2,
  Shield,
  Sparkles,
  ArrowRight,
  WifiOff,
  ScanLine,
  Mic,
  Send,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Lock,
} from 'lucide-react';

export default function DemoSandboxPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLaunchPersona = async (demoKey: keyof typeof DEMO_USERS, targetRoute: string) => {
    setLoadingRole(demoKey);
    const user = DEMO_USERS[demoKey];
    const cred = DEFAULT_CREDENTIALS[user.email] || { password: 'Password123!' };

    const result = await login(user.email, cred.password, user.system_role, true);
    setLoadingRole(null);

    if (result.success) {
      router.push(targetRoute);
    } else {
      alert(`Demo login failed: ${result.error || 'Please try again'}`);
    }
  };

  const handleResetSandbox = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lead2b_active_user');
        localStorage.removeItem('lead2b_offline_queue');
      }
      setResetMessage('Sandbox cache cleared successfully. You can now select a fresh persona.');
      setTimeout(() => setResetMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-[#00838f] selection:text-white pb-16">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Interactive Demo Sandbox
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-500 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Production Client Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00838f]/10 border border-[#00838f]/30 text-teal-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>One-Click Enterprise Evaluation • No Passwords Required</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Experience the Elite Alternative to Standard Event Badging
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Select any system persona below to launch immediately into the live working platform.
          Test offline badge capture, AI voice notes, digital whitepaper fulfillment, and CRM webhooks.
        </p>

        {resetMessage && (
          <div className="mt-4 max-w-md mx-auto p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}
      </section>

      {/* Persona Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Persona 1: Sales Rep PWA */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 rounded-3xl border border-teal-500/30 hover:border-teal-400/60 p-6 flex flex-col justify-between shadow-xl shadow-teal-950/20 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-[#00838f] group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-teal-400" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                  Most Popular
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">Field Sales Rep</h2>
              <p className="text-xs text-slate-400 mb-4">Mobile Badge & Lead Capture PWA</p>

              <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 text-xs mb-5 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Demo Account:</span>
                  <span className="font-semibold text-white">Tariq Mansoor</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Company / Booth:</span>
                  <span className="text-teal-400 font-semibold">AlphaTech • H3-B24</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Interface:</span>
                  <span className="font-mono text-[11px] text-slate-300">/app/dashboard</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Sub-second Badge Camera Scanner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Speech-to-Lead AI Dictation</span>
                </div>
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>100% Offline-First IndexedDB Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>1-Click Digital Collateral Fulfillment</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="lg"
              isLoading={loadingRole === 'sales_rep'}
              onClick={() => handleLaunchPersona('sales_rep', '/app/dashboard')}
              className="w-full font-black py-3.5 shadow-lg shadow-teal-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Sales PWA</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Persona 2: Exhibitor Booth Admin */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 rounded-3xl border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl transition-all group relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                  Booth Manager
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">Exhibitor Admin</h2>
              <p className="text-xs text-slate-400 mb-4">Exhibitor Operations & Team Hub</p>

              <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 text-xs mb-5 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Demo Account:</span>
                  <span className="font-semibold text-white">David Miller</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Exhibitor Org:</span>
                  <span className="text-sky-400 font-semibold">Alpha Technology (10 Lic.)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Interface:</span>
                  <span className="font-mono text-[11px] text-slate-300">/exhibitor/dashboard</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Real-time Booth Velocity Leaderboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Dynamic Form Engine & Question Builder</span>
                </div>
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>HubSpot / Salesforce / Slack Webhooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Collateral Library Management</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              isLoading={loadingRole === 'exhibitor_admin'}
              onClick={() => handleLaunchPersona('exhibitor_admin', '/exhibitor/dashboard')}
              className="w-full font-bold py-3.5 bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Exhibitor Console</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Persona 3: Platform Super Admin */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-900/80 rounded-3xl border border-slate-800 hover:border-slate-700 p-6 flex flex-col justify-between shadow-xl transition-all group relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Platform Owner
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">Organizer & Super Admin</h2>
              <p className="text-xs text-slate-400 mb-4">Multi-Tenant Platform Governance</p>

              <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-slate-800 text-xs mb-5 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Demo Account:</span>
                  <span className="font-semibold text-white">Sheik Abdullah / Admin</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Scope:</span>
                  <span className="text-emerald-400 font-semibold">Global Platform Root</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target Interface:</span>
                  <span className="font-mono text-[11px] text-slate-300">/admin/dashboard</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Tenant Provisioner & Scanner Licenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Exhibition Aggregated Telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Audit Logs & Security Compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Global Event Registry Management</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              isLoading={loadingRole === 'super_admin'}
              onClick={() => handleLaunchPersona('super_admin', '/admin/dashboard')}
              className="w-full font-bold py-3.5 bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Admin Suite</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Guided Walkthrough Scenarios */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Guided Testing Scenarios</span>
                <span className="text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                  Recommended Test Paths
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try these 4 scenarios to evaluate how lead2b out-performs standard expo badging apps.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetSandbox}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Demo Cache</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
              <span className="text-[10px] font-black uppercase text-teal-400">Scenario 1</span>
              <h4 className="text-sm font-bold text-white mt-1">Offline Cell Tower Blackout</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Open Sales PWA, switch your browser to Offline mode in DevTools, scan a test badge or card. It saves instantly in IndexedDB without spinning.
              </p>
            </div>

            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
              <span className="text-[10px] font-black uppercase text-teal-400">Scenario 2</span>
              <h4 className="text-sm font-bold text-white mt-1">Opaque Badge + Card Companion</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                When attendee data is locked by the organizer, scan the badge token, then tap &apos;Snap Business Card&apos; to merge OCR data into the same record.
              </p>
            </div>

            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
              <span className="text-[10px] font-black uppercase text-teal-400">Scenario 3</span>
              <h4 className="text-sm font-bold text-white mt-1">Voice AI Meeting Dictation</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                After a quick discussion, tap the microphone and dictate notes. Natural language processing parses action items and budget automatically.
              </p>
            </div>

            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80">
              <span className="text-[10px] font-black uppercase text-teal-400">Scenario 4</span>
              <h4 className="text-sm font-bold text-white mt-1">Instant Collateral Email</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                In the quick qualify form, check &apos;Product Brochure&apos; and save. The prospect receives an automated fulfillment email in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 text-center text-xs text-slate-500">
        <p>lead2b Enterprise Lead Retrieval • Built for high-volume exhibitions and corporate trade shows.</p>
        <p className="mt-1">
          Ready to onboard your organization?{' '}
          <Link href="/login" className="text-teal-400 hover:underline font-semibold">
            Go to Production Sign In →
          </Link>
        </p>
      </footer>
    </div>
  );
}
