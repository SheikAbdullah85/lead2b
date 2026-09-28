'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/context';
import { Building2, Sparkles, CheckCircle2, QrCode } from 'lucide-react';

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
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-3">
            L2
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Booth Team Onboarding
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">Join Alpha Technology Group</h2>
          <p className="text-xs text-slate-500 mt-1">
            GITEX Global 2026 • Stand H3-B24
          </p>
        </div>

        {joinedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Welcome to the Team!</h3>
            <p className="text-xs text-slate-500">Redirecting to Mobile Lead Scanner...</p>
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-3.5">
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
              className="w-full font-bold bg-blue-600 hover:bg-blue-700 shadow-md mt-2"
            >
              <Sparkles className="w-4 h-4 mr-1 text-sky-200" />
              Activate Mobile App & Start Scanning
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
