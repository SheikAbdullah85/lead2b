'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrScannerView } from '@/components/scanner/QrScannerView';
import { QuickQualifyForm } from '@/components/forms/QuickQualifyForm';
import { Attendee, Lead } from '@/lib/types';
import { localDb } from '@/lib/db/dexie';
import { INITIAL_ATTENDEES, INITIAL_LEADS } from '@/lib/data/mock-store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search, AlertTriangle, ArrowLeft, RefreshCw, QrCode } from 'lucide-react';
import { playWarningBeep } from '@/lib/utils/sound';

export default function ScanPage() {
  const router = useRouter();
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Handle scanned QR code text
  const handleQrDecoded = async (qrText: string) => {
    let badgeId = qrText.trim();
    if (badgeId.startsWith('lead2b:badge:')) {
      badgeId = badgeId.replace('lead2b:badge:', '');
    }

    // 1. Check local Dexie first for offline lookup, then mock store
    let matchedAttendee = await localDb.attendees
      .where('badge_id')
      .equalsIgnoreCase(badgeId)
      .first();

    if (!matchedAttendee) {
      matchedAttendee = INITIAL_ATTENDEES.find(
        (a) => a.badge_id.toLowerCase() === badgeId.toLowerCase() || a.qr_token === qrText
      );
    }

    if (!matchedAttendee) {
      // Create on the fly if unknown visitor badge format
      matchedAttendee = {
        id: `att_${Date.now()}`,
        event_id: 'eeee1111-1111-1111-1111-111111111111',
        badge_id: badgeId,
        qr_token: qrText,
        first_name: 'Visitor',
        last_name: badgeId.slice(-4),
        company: 'Exhibition Visitor',
        email: `visitor_${badgeId.slice(-4).toLowerCase()}@event.example.com`,
        visitor_type: 'Trade Visitor',
        consent_status: true,
      };
    }

    // 2. Duplicate Detection Check
    const localExisting = await localDb.leads
      .where('attendee_id')
      .equals(matchedAttendee.id)
      .first();

    const memExisting = INITIAL_LEADS.find((l) => l.attendee_id === matchedAttendee?.id);
    const existing = localExisting || memExisting;

    if (existing) {
      playWarningBeep();
      setDuplicateLead(existing);
      setScannedAttendee(matchedAttendee);
      return;
    }

    // 3. Open Quick Qualify immediately
    setScannedAttendee(matchedAttendee);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    setIsSearchingManual(true);
    setSearchNotFound(false);

    try {
      const q = manualQuery.toLowerCase();
      // Search local Dexie attendees or mock attendees
      let match = await localDb.attendees
        .filter((a) => a.badge_id.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || `${a.first_name} ${a.last_name}`.toLowerCase().includes(q))
        .first();

      if (!match) {
        match = INITIAL_ATTENDEES.find(
          (a) =>
            a.badge_id.toLowerCase().includes(q) ||
            a.email.toLowerCase().includes(q) ||
            `${a.first_name} ${a.last_name}`.toLowerCase().includes(q)
        );
      }

      if (match) {
        handleQrDecoded(match.badge_id);
      } else {
        setSearchNotFound(true);
      }
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleLeadSaved = (savedLead: Lead) => {
    setScannedAttendee(null);
    setDuplicateLead(null);
    // Salesperson can immediately scan the next visitor!
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/app/dashboard')}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5" /> Fast Scanner
        </span>
      </div>

      {/* Main Viewfinder Scanner */}
      <QrScannerView onScanSuccess={handleQrDecoded} isScanningActive={!scannedAttendee} />

      {/* Manual Badge / Email Search Fallback */}
      <div className="pt-2">
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search Badge ID, Name, or Email..."
              className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <Button type="submit" variant="secondary" size="md" isLoading={isSearchingManual}>
            Find
          </Button>
        </form>

        {searchNotFound && (
          <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
            <span>No attendee found with that query.</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/app/lead/new')}
              className="text-[11px] bg-white"
            >
              Create Manual Lead
            </Button>
          </div>
        )}
      </div>

      {/* Quick Lead Qualification Modal (5-second flow) */}
      <Modal
        isOpen={!!scannedAttendee && !duplicateLead}
        onClose={() => setScannedAttendee(null)}
        title="Qualify Lead"
        description="Verify visitor profile and assign quick score"
      >
        {scannedAttendee && (
          <QuickQualifyForm
            attendee={scannedAttendee}
            onSuccess={handleLeadSaved}
            onCancel={() => setScannedAttendee(null)}
          />
        )}
      </Modal>

      {/* Duplicate Lead Detection Modal */}
      <Modal
        isOpen={!!duplicateLead}
        onClose={() => setDuplicateLead(null)}
        title="Duplicate Lead Detected"
      >
        {duplicateLead && (
          <div className="space-y-4 text-left">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">This visitor has already been captured.</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Captured at{' '}
                  {new Date(duplicateLead.captured_at || duplicateLead.created_at).toLocaleString()}{' '}
                  by {duplicateLead.captured_by_name || 'Booth Rep'}.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-800">{duplicateLead.first_name} {duplicateLead.last_name}</p>
              <p className="text-slate-500">{duplicateLead.company} • {duplicateLead.job_title}</p>
              <div className="pt-2 flex items-center gap-2">
                <Badge variant={duplicateLead.rating as any}>{duplicateLead.rating.toUpperCase()}</Badge>
                <Badge variant="outline">{duplicateLead.status}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDuplicateLead(null)}
              >
                Scan Next
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => router.push(`/app/lead/${duplicateLead.id}`)}
              >
                View Existing Lead
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
