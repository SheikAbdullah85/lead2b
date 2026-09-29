'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BusinessCardScanner } from '@/components/image/BusinessCardScanner';
import { ArrowLeft, CreditCard, Sparkles } from 'lucide-react';
import { Lead } from '@/lib/types';

export default function BusinessCardPage() {
  const router = useRouter();

  const handleSaved = (savedLead: Lead) => {
    router.push(`/app/lead/${savedLead.id}`);
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-700 px-2 py-1 -ml-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back</span>
        </button>
        <span className="text-xs font-black uppercase tracking-wider text-brand-700 flex items-center gap-1.5 bg-brand-50 border border-brand-200/60 px-2.5 py-1 rounded-full">
          <CreditCard className="w-3.5 h-3.5 text-brand-600" />
          <span>Card Capture</span>
        </span>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-900 leading-tight">Capture Business Card</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Snap visitor card to auto-compress and capture lead offline
          </p>
        </div>
        <BusinessCardScanner
          onSuccess={handleSaved}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
