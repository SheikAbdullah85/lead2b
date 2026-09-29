'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/lib/auth/context';
import { Building2, Sparkles, CheckCircle2, QrCode, ShieldCheck, ArrowRight } from 'lucide-react';

export default function InviteJoinPage({ params }: { params: { code: string } }) {
  const router = useRouter();
  const { login } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('lead2b-pass-2026');
  const [mobile, setMobile] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSubmitting(true);
    await login(email, 'sales_rep');
    setIsSubmitting(false);
    setJoinedSuccess(true);

    setTimeout(() => {
      router.push('/app/dashboard');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="md" className="mb-4" />
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-1 rounded-full">
            Booth Team Onboarding
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2">Join Alpha Technology Group</h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
            GITEX Global 2026 • Stand H3-B24
          </p>
        </div>

        {joinedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm ring-4 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Welcome to the Booth!</h3>
            <p className="text-xs text-slate-500">Redirecting to your mobile badge scanner...</p>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3.5">
            <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-xs text-brand-900 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 block">Invite Code</span>
                <span className="font-mono font-bold">{params.code}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>

            <Input
              label="Your Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Tariq Mansoor"
              required
            />

            <Input
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@alphatech.com"
              required
            />

            <Input
              label="Mobile Phone"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+971 55 000 0000"
            />

            <Input
              label="Create Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full font-bold shadow-md mt-2 py-3"
            >
              <Sparkles className="w-4 h-4 mr-1 text-cyan-200" />
              <span>Activate Sales Badge & Enter</span>
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-slate-500 flex items-center gap-1.5 font-medium">
        <ShieldCheck className="w-4 h-4 text-brand-400" />
        <span>Secured by lead2b Enterprise Multi-Tenant Engine</span>
      </div>
    </div>
  );
}
