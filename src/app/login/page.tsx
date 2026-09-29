'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, DEMO_USERS, DEFAULT_CREDENTIALS } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import {
  Lock,
  Mail,
  Sparkles,
  Smartphone,
  Building2,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  Info,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCredentialsCheatSheet, setShowCredentialsCheatSheet] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const result = await login(email, password);
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

    const user = result.user;
    if (user?.system_role === 'sales_rep') {
      router.push('/app/dashboard');
    } else if (user?.system_role === 'exhibitor_admin') {
      router.push('/exhibitor/dashboard');
    } else {
      router.push('/admin/dashboard');
    }
  };

  const handlePreFillPersona = (emailToFill: string, passwordToFill: string) => {
    setEmail(emailToFill);
    setPassword(passwordToFill);
    setErrorMessage(null);
  };

  const handleQuickDemoLogin = async (demoKey: keyof typeof DEMO_USERS) => {
    const user = DEMO_USERS[demoKey];
    const cred = DEFAULT_CREDENTIALS[user.email] || { password: 'Password123!' };
    setEmail(user.email);
    setPassword(cred.password);
    setErrorMessage(null);
    setIsLoading(true);

    const result = await login(user.email, cred.password, user.system_role);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Login failed.');
      return;
    }

    if (redirectParam && redirectParam.startsWith('/')) {
      router.push(redirectParam);
      return;
    }

    if (user.system_role === 'sales_rep') {
      router.push('/app/dashboard');
    } else if (user.system_role === 'exhibitor_admin') {
      router.push('/exhibitor/dashboard');
    } else {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Logo size="lg" />
        <p className="text-xs text-slate-500 mt-2 font-medium">
          Enterprise Lead Capture & Commercial Sales Platform
        </p>
      </div>

      {/* Redirect Notice if user was sent here by AuthGuard */}
      {redirectParam && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-[#00838f] shrink-0" />
          <span>Please sign in with your credentials to access that portal.</span>
        </div>
      )}

      {/* 1-Click Fast Persona Fill / Login */}
      <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#00838f]" />
            <span>Select System Persona:</span>
          </span>
          <button
            type="button"
            onClick={() => setShowCredentialsCheatSheet(!showCredentialsCheatSheet)}
            className="text-[10px] text-[#00838f] hover:underline font-bold"
          >
            {showCredentialsCheatSheet ? 'Hide Credentials' : 'View Passwords'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('sales_rep')}
            className="px-2.5 py-2 rounded-xl bg-white border border-teal-200 hover:border-teal-400 hover:bg-teal-50/50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#00838f] shrink-0" />
            <div>
              <p className="leading-none text-slate-900">Sales Rep</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Mobile Badge PWA</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('exhibitor_admin')}
            className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
            <div>
              <p className="leading-none text-slate-900">Exhibitor</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Booth Manager</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('organizer_admin')}
            className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <p className="leading-none text-slate-900">Organizer</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">GITEX Portal</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('super_admin')}
            className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="leading-none text-slate-900">Super Admin</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Platform Owner</p>
            </div>
          </button>
        </div>

        {/* Cheat sheet table */}
        {showCredentialsCheatSheet && (
          <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5 text-[11px] text-slate-600 font-mono">
            <p className="font-sans font-bold text-slate-800 text-xs mb-1">Standard Credentials:</p>
            <div className="flex justify-between bg-white p-1.5 rounded border border-slate-200">
              <span>tariq@alphatech.com</span>
              <span className="text-[#00838f] font-bold">Password123!</span>
            </div>
            <div className="flex justify-between bg-white p-1.5 rounded border border-slate-200">
              <span>exhibitor@alphatech.com</span>
              <span className="text-[#00838f] font-bold">Password123!</span>
            </div>
            <div className="flex justify-between bg-white p-1.5 rounded border border-slate-200">
              <span>organizer@gitex.com</span>
              <span className="text-[#00838f] font-bold">Password123!</span>
            </div>
            <div className="flex justify-between bg-white p-1.5 rounded border border-slate-200">
              <span>admin@lead2b.com</span>
              <span className="text-[#00838f] font-bold">Password123!</span>
            </div>
          </div>
        )}
      </div>

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
              placeholder="e.g. tariq@alphatech.com"
              required
              className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30 focus:border-[#00838f] text-slate-800 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-10 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30 focus:border-[#00838f] text-slate-800 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-slate-300 text-[#00838f] focus:ring-[#00838f]"
            />
            <span>Remember session</span>
          </label>
          <button
            type="button"
            onClick={() => handlePreFillPersona('tariq@alphatech.com', 'Password123!')}
            className="font-bold text-[#00838f] hover:underline"
          >
            Fill Demo Rep
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          className="w-full font-black mt-2 shadow-lg shadow-teal-700/25 py-3 text-sm"
        >
          Sign In with Credentials
        </Button>
      </form>

      <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
        Multi-tenant isolation • PostgreSQL Row-Level Security
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-[#00838f] selection:text-white">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center text-slate-500">
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
