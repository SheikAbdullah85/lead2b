'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_USERS } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { Lock, Mail, Sparkles, Smartphone, Building2, UserCheck, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('lead2b-pass-2026');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email);
    setIsLoading(false);

    const matched = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched?.system_role === 'sales_rep') {
      router.push('/app/dashboard');
    } else if (matched?.system_role === 'exhibitor_admin') {
      router.push('/exhibitor/dashboard');
    } else {
      router.push('/admin/dashboard');
    }
  };

  const handleQuickDemoLogin = async (demoKey: keyof typeof DEMO_USERS) => {
    const user = DEMO_USERS[demoKey];
    setEmail(user.email);
    setIsLoading(true);
    await login(user.email, user.system_role);
    setIsLoading(false);

    if (user.system_role === 'sales_rep') {
      router.push('/app/dashboard');
    } else if (user.system_role === 'exhibitor_admin') {
      router.push('/exhibitor/dashboard');
    } else {
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-[#00838f] selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" />
          <p className="text-xs text-slate-500 mt-2 font-medium">
            Event Lead Capture & Sales Engagement Platform
          </p>
        </div>

        {/* 1-Click Fast Persona Switcher */}
        <div className="mb-6 p-3 bg-teal-50/60 border border-teal-200/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-black text-teal-900 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00838f]" />
              <span>Instant Persona Login (1-Tap):</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('sales_rep')}
              className="px-2.5 py-2 rounded-xl bg-white border border-teal-200 hover:border-teal-400 hover:bg-teal-50/50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-[#00838f] shrink-0" />
              <div>
                <p className="leading-none">Sales Rep</p>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">Mobile PWA</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('exhibitor_admin')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
              <div>
                <p className="leading-none">Exhibitor</p>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">Booth Admin</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('organizer_admin')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="leading-none">Organizer</p>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">GITEX Admin</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('super_admin')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-xs font-bold text-slate-800 text-left flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="leading-none">Super Admin</p>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">Full System</p>
              </div>
            </button>
          </div>
        </div>

        {/* Standard Email / Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Work Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tariq@alphatech.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-[#00838f] focus:ring-[#00838f]" />
              <span>Remember session</span>
            </label>
            <a href="#" className="font-bold text-[#00838f] hover:underline">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full font-black mt-2 shadow-lg shadow-teal-700/25"
          >
            Sign In to Account
          </Button>
        </form>

        <p className="text-center text-[11px] text-slate-400 mt-6 font-medium">
          Multi-tenant isolation • PostgreSQL Row-Level Security
        </p>
      </div>
    </div>
  );
}
