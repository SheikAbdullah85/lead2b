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
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const { login } = useAuth();

  const [email, setEmail] = useState('sheik85@gmail.com');
  const [password, setPassword] = useState('Craftix@2026');
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

    // Default to Mobile Lead Capture App
    router.push('/app/dashboard');
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Logo size="lg" />
        <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
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
              className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30 focus:border-[#00838f] text-slate-800 font-medium"
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
              className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-10 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30 focus:border-[#00838f] text-slate-800 font-medium"
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

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
            <input
              type="checkbox"
              defaultChecked
              className="rounded border-slate-300 text-[#00838f] focus:ring-[#00838f]"
            />
            <span>Remember session on this device</span>
          </label>
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
          Encrypted 256-bit TLS • Multi-tenant Data Isolation
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
