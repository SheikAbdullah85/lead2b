'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BusinessCardScanner } from '@/components/image/BusinessCardScanner';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Lead } from '@/lib/types';

export default function BusinessCardPage() {
  const router = useRouter();

  const handleSaved = (savedLead: Lead) => {
    router.push(`/app/lead/${savedLead.id}`);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
          <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> Business Card Capture
        </span>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <BusinessCardScanner
          onSuccess={handleSaved}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}
