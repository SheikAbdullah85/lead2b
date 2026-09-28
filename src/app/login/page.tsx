'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_USERS } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

    // Route according to user role
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
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-blue-600">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            L2
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to lead2b</h2>
          <p className="text-xs text-slate-500 mt-1">
            Event Lead Capture & Sales Engagement Platform
          </p>
        </div>

        {/* 1-Click Fast Demo Login Buttons */}
        <div className="mb-6 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Quick Demo Sign-In (1-Tap):</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('sales_rep')}
              className="px-2.5 py-2 rounded-lg bg-white border border-blue-200 hover:border-blue-400 text-xs font-semibold text-slate-800 text-left flex items-center gap-2 shadow-sm transition"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <div>
                <p className="leading-none">Sales Rep</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Mobile PWA</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('exhibitor_admin')}
              className="px-2.5 py-2 rounded-lg bg-white border border-indigo-200 hover:border-indigo-400 text-xs font-semibold text-slate-800 text-left flex items-center gap-2 shadow-sm transition"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <div>
                <p className="leading-none">Exhibitor Admin</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Portal</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('organizer_admin')}
              className="px-2.5 py-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 text-xs font-semibold text-slate-800 text-left flex items-center gap-2 shadow-sm transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <div>
                <p className="leading-none">Organizer</p>
                <p className="text-[10px] text-slate-400 mt-0.5">GITEX Admin</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('super_admin')}
              className="px-2.5 py-2 rounded-lg bg-white border border-emerald-200 hover:border-emerald-400 text-xs font-semibold text-slate-800 text-left flex items-center gap-2 shadow-sm transition"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <div>
                <p className="leading-none">Super Admin</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Full Platform</p>
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
            placeholder="name@company.com"
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
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
              <span>Remember this device</span>
            </label>
            <a href="#" className="font-semibold text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md font-bold mt-2"
          >
            Sign In to Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Multi-tenant isolation enabled • PostgreSQL RLS protected
        </p>
      </div>
    </div>
  );
}
