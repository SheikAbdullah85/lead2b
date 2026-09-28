'use client';

import React from 'react';
import { PortalHeader } from '@/components/layout/PortalHeader';

export default function ExhibitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader type="exhibitor" />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
