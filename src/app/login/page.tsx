'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import {
  Lock,
  Mail,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  Info,
  Smartphone,
  Building2,
  Shield,
  QrCode,
  WifiOff,
  Trophy,
  BarChart3,
  Layers,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Globe2,
  Cpu,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { login } = useAuth();

  const [email, setEmail] = useState('sheik85@gmail.com');
  const [password, setPassword] = useState('Craftix@2026');
  const [targetPortal, setTargetPortal] = useState<string>('/admin/dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const result = await login(email, password, undefined, false);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid email or password. Please try again.');
      return;
    }

    // Determine target redirect route
    if (redirectParam && redirectParam.startsWith('/')) {
      router.push(redirectParam);
      return;
    }

    // Direct to selected target portal
    router.push(targetPortal);
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-2xl p-6 sm:p-8 sm:py-10 border border-slate-200/90 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Logo size="lg" />
        <span className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Production Workspace
        </span>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Authorized Admin: <strong className="text-slate-800">sheik85@gmail.com</strong>
        </p>
      </div>

      {/* Redirect Notice if user was sent here by AuthGuard */}
      {redirectParam && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#00838f] shrink-0" />
          <span>Please sign in with your credentials to access that portal.</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Standard Email / Password Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Work Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30 focus:border-[#00838f] text-slate-800 font-medium transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Password
            </label>
            <a
              href="mailto:support@lead2b.com?subject=Password%20Reset%20Request"
              className="text-[11px] text-[#00838f] hover:underline font-medium"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-10 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30 focus:border-[#00838f] text-slate-800 font-medium transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Target Workspace
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setTargetPortal('/admin/dashboard')}
              className={`p-2.5 rounded-xl text-center border text-[11px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                targetPortal === '/admin/dashboard'
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className={`w-3.5 h-3.5 ${targetPortal === '/admin/dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>Organizer</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetPortal('/exhibitor/dashboard')}
              className={`p-2.5 rounded-xl text-center border text-[11px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                targetPortal === '/exhibitor/dashboard'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${targetPortal === '/exhibitor/dashboard' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Exhibitor</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetPortal('/app/dashboard')}
              className={`p-2.5 rounded-xl text-center border text-[11px] font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                targetPortal === '/app/dashboard'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Smartphone className={`w-3.5 h-3.5 ${targetPortal === '/app/dashboard' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>Mobile App</span>
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full font-black mt-2 shadow-lg shadow-teal-700/25 py-3 text-sm cursor-pointer"
        >
          Sign In to Workspace
        </Button>
      </form>

      <div className="text-center mt-6 pt-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 font-medium">
          Encrypted 256-bit TLS • Multi-tenant Isolation
        </p>
        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-center gap-2 text-xs">
          <span className="text-slate-400">Evaluating lead2b?</span>
          <Link
            href="/demo"
            className="font-bold text-[#00838f] hover:text-[#006978] transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Interactive Demo Sandbox →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden selection:bg-[#00838f] selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[550px] h-[550px] bg-teal-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main 2-Column Responsive Layout */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* LEFT COLUMN: Application Features & Infographics */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 lg:pr-4">
          
          {/* Header Pill & Title */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-black tracking-wide uppercase mb-3">
              <Zap className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>Next-Gen Exhibition Lead Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Capture, Qualify & Close Leads <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">At Exhibition Scale</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-2xl leading-relaxed">
              Engineered specifically for global expos and multi-tenant trade shows. Zero internet dependency on exhibition floors, deterministic cloud sync, and instant booth staff analytics.
            </p>
          </div>

          {/* Infographics Flow Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            
            {/* Feature 1: QR & AI Card OCR */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-teal-500/40 transition-all duration-300 group hover:shadow-lg hover:shadow-teal-950/40">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Sub-Second Badge Scan
                    <span className="text-[10px] font-mono font-black text-teal-400 bg-teal-500/15 px-1.5 py-0.5 rounded">150ms</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Instantly scan QR attendee badges or extract business card details with built-in AI OCR camera capture.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Offline-First Engine */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all duration-300 group hover:shadow-lg hover:shadow-cyan-950/40">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <WifiOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Zero-Drop Offline Engine
                    <span className="text-[10px] font-mono font-black text-cyan-400 bg-cyan-500/15 px-1.5 py-0.5 rounded">IndexedDB</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Keep scanning during venue WiFi blackouts. Queued captures auto-reconnect and sync seamlessly.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Dynamic Forms & Branching */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300 group hover:shadow-lg hover:shadow-emerald-950/40">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Custom Qualifying Forms
                    <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">Branching</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Configurable survey questions, conditional logic, budget timelines, and VIP prioritization per tenant.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4: Gamified Leaderboard & CRM Export */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 transition-all duration-300 group hover:shadow-lg hover:shadow-amber-950/40">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Live Booth Leaderboard
                    <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">Real-time</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Motivate booth staff with real-time capture rankings, instant CSV/Excel export, and CRM integration.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Architecture Infographic Banner: 3 Dedicated Role Portals */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border border-teal-500/20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-teal-300" />
              <span>Full-Stack Multi-Tenant Ecosystem</span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Shield className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <div className="text-xs font-black text-white">Organizer</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Floorplans, Tenants & Licenses</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Building2 className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                <div className="text-xs font-black text-white">Exhibitor</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Forms, Reps & Lead Analytics</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <Smartphone className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-xs font-black text-white">Booth Rep</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ultra-Fast Scanner & Follow-ups</div>
              </div>
            </div>
          </div>

          {/* Trust Badges Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              SOC2 & GDPR Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              100% Offline Resilience
            </span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              PWA Instant Installation
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: Login Panel */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md">
            <Suspense
              fallback={
                <div className="w-full bg-white rounded-3xl p-8 text-center text-slate-500 shadow-2xl">
                  Loading workspace...
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>

      </div>
    </div>
  );
}

