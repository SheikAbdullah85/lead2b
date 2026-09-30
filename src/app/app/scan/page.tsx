'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrScannerView } from '@/components/scanner/QrScannerView';
import { QuickQualifyForm } from '@/components/forms/QuickQualifyForm';
import { Attendee, Lead, LeadRating, PriorityLevel, PurchaseTimeline } from '@/lib/types';
import { localDb } from '@/lib/db/dexie';
import { INITIAL_ATTENDEES, INITIAL_LEADS } from '@/lib/data/mock-store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { parseBadgeQr } from '@/lib/utils/qr-parser';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import {
  Search,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Sparkles,
  UserPlus,
  Camera,
  CheckCircle2,
  ListFilter,
  Flame,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { playWarningBeep } from '@/lib/utils/sound';

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Mode: Camera Scanner vs. Direct Manual Entry Form
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');

  // Scanner states
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Manual Form States (Instant offline-ready in-memory form)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [productInterest, setProductInterest] = useState('Enterprise AI Platform');
  const [rating, setRating] = useState<LeadRating>('warm');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [timeline, setTimeline] = useState<PurchaseTimeline>('1-3 months');
  const [notes, setNotes] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [manualSaveSuccess, setManualSaveSuccess] = useState<Lead | null>(null);

  // Handle scanned QR code text
  const handleQrDecoded = async (qrText: string) => {
    const parsed = parseBadgeQr(qrText);
    const badgeId = parsed.badgeId;

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
      // Create on the fly using parsed QR information (e.g., vCard, JSON, or badge token)
      matchedAttendee = {
        id: `att_${Date.now()}`,
        event_id: 'eeee1111-1111-1111-1111-111111111111',
        badge_id: badgeId,
        qr_token: qrText,
        first_name: parsed.firstName || (parsed.fullName ? parsed.fullName.split(' ')[0] : 'Visitor'),
        last_name: parsed.lastName || (parsed.fullName ? parsed.fullName.split(' ').slice(1).join(' ') : badgeId.slice(-4)),
        company: parsed.company || 'Exhibition Visitor',
        job_title: parsed.jobTitle || 'Visitor',
        email: parsed.email || `visitor_${badgeId.slice(-4).toLowerCase()}@event.example.com`,
        mobile: parsed.phone,
        website: parsed.website,
        visitor_type: (parsed.visitorType as any) || 'Trade Visitor',
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
  };

  // Submit manual form directly to Dexie IndexedDB
  const handleSaveManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('First name and last name are required.');
      return;
    }

    setIsSavingManual(true);
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      const leadPayload: Omit<Lead, 'id' | 'local_id' | 'sync_status'> = {
        tenant_id: user?.tenant_id || '11111111-1111-1111-1111-111111111111',
        event_id: 'eeee1111-1111-1111-1111-111111111111',
        captured_by: user?.id || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        captured_by_name: user?.full_name || 'Tariq Mansoor',
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        company: company.trim() || 'Trade Visitor',
        job_title: jobTitle.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        country: 'United Arab Emirates',
        source: 'manual',
        rating,
        status: 'new',
        priority,
        product_interest: productInterest,
        purchase_timeline: timeline,
        requirement: notes.trim(),
        followup_required: true,
        followup_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        capture_method: 'manual',
        captured_at: new Date().toISOString(),
        online_offline: isOnline ? 'online' : 'offline',
        consent_status: true,
        email_marketing_consent: true,
        privacy_policy_accepted: true,
        consent_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const saved = await saveLeadLocally(leadPayload);
      setManualSaveSuccess(saved);
    } catch (err) {
      console.error('Manual lead save failed:', err);
      alert('Failed to save lead offline. Please retry.');
    } finally {
      setIsSavingManual(false);
    }
  };

  const resetManualForm = () => {
    setManualSaveSuccess(null);
    setFirstName('');
    setLastName('');
    setCompany('');
    setJobTitle('');
    setEmail('');
    setMobile('');
    setNotes('');
  };

  return (
    <div className="space-y-3.5 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/app/dashboard')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-700 px-2 py-1 -ml-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Dashboard</span>
        </button>
        <span className="text-xs font-black uppercase tracking-wider text-brand-700 flex items-center gap-1.5 bg-brand-50 border border-brand-200/60 px-2.5 py-1 rounded-full">
          <QrCode className="w-3.5 h-3.5 text-brand-600" />
          <span>Lead Capture</span>
        </span>
      </div>

      {/* Mode Switcher Tabs: Camera vs. Manual Form */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('scan');
            setManualSaveSuccess(null);
          }}
          className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'scan'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Scan Badge QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'manual'
              ? 'bg-[#00838f] text-white shadow-sm font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Manual Lead Form</span>
        </button>
      </div>

      {/* VIEW 1: CAMERA SCANNER */}
      {activeTab === 'scan' && (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {/* Main Viewfinder Scanner */}
          <QrScannerView onScanSuccess={handleQrDecoded} isScanningActive={!scannedAttendee} />

          {/* Quick Direct Link to Manual Form */}
          <div className="flex items-center justify-between p-2.5 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl text-xs">
            <span className="text-cyan-900 font-medium text-[11px]">No physical badge to scan?</span>
            <Button
              size="sm"
              variant="primary"
              className="text-[11px] font-bold py-1 px-3"
              onClick={() => setActiveTab('manual')}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Enter Details Manually
            </Button>
          </div>

          {/* Manual Badge / Email Search Fallback */}
          <div className="pt-1">
            <form onSubmit={handleManualSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Search Badge ID, Name, or Email..."
                  className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-3 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800"
                />
              </div>
              <Button type="submit" variant="secondary" size="md" isLoading={isSearchingManual} className="font-bold">
                Find
              </Button>
            </form>

            {searchNotFound && (
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between animate-in fade-in-50">
                <span className="font-medium">No badge found with that query.</span>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setActiveTab('manual')}
                  className="text-[11px] font-bold"
                >
                  Fill Manual Form
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: DIRECT MANUAL LEAD ENTRY FORM (100% OFFLINE SAFE) */}
      {activeTab === 'manual' && (
        <div className="animate-in fade-in-50 duration-150">
          {manualSaveSuccess ? (
            /* Success confirmation card */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs text-center space-y-3.5">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Lead Saved Offline!</h3>
                <p className="text-xs font-bold text-slate-700 mt-1">
                  {manualSaveSuccess.first_name} {manualSaveSuccess.last_name} ({manualSaveSuccess.company})
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Stored in Offline Vault • Ready for Cloud Sync
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full font-bold shadow-md"
                  onClick={resetManualForm}
                >
                  <UserPlus className="w-4 h-4 mr-1.5 text-cyan-200" />
                  + Enter Next Lead
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full font-bold"
                  onClick={() => setActiveTab('scan')}
                >
                  <Camera className="w-3.5 h-3.5 mr-1" />
                  Switch Back to Camera Scanner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold"
                  onClick={() => router.push('/app/leads')}
                >
                  <ListFilter className="w-3.5 h-3.5 mr-1" />
                  View All Captured Leads
                </Button>
              </div>
            </div>
          ) : (
            /* Direct Form */
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Enter Visitor Lead</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Instant offline capture for walk-ins without QR badges
                </p>
              </div>

              <form onSubmit={handleSaveManualLead} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="First Name *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. David"
                  />
                  <Input
                    label="Last Name *"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Miller"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Company Name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Global Tech"
                  />
                  <Input
                    label="Designation"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. VP Operations"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                  />
                  <Input
                    label="Mobile Number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+971 50 123 4567"
                  />
                </div>

                {/* Lead Rating */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Rating Priority
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 'hot', label: '🔥 Hot Lead', activeClass: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200' },
                      { val: 'warm', label: '☀️ Warm Lead', activeClass: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200' },
                      { val: 'cold', label: '❄️ Cold Lead', activeClass: 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-200' },
                    ].map((r) => (
                      <button
                        key={r.val}
                        type="button"
                        onClick={() => setRating(r.val as any)}
                        className={`py-2 text-[11px] font-black rounded-xl border transition ${
                          rating === r.val
                            ? r.activeClass
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Interest */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Product Interest
                  </label>
                  <select
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                    className="w-full h-10 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="Enterprise AI Platform">Enterprise AI Platform</option>
                    <option value="Cloud Infrastructure & Security">Cloud Infrastructure & Security</option>
                    <option value="Smart Analytics & CRM Suite">Smart Analytics & CRM Suite</option>
                    <option value="Custom Software Development">Custom Software Development</option>
                  </select>
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Buying Timeline
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { val: 'immediate', label: '< 30 Days' },
                      { val: '1-3 months', label: '1 - 3 Mo' },
                      { val: '3-6 months', label: '3 - 6 Mo' },
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => setTimeline(t.val as any)}
                        className={`py-1.5 text-[11px] font-bold rounded-xl border transition ${
                          timeline === t.val
                            ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Booth Notes / Requirements
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Key interest, requested quotation, follow-up timeline..."
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-800"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSavingManual}
                  className="w-full font-bold shadow-md py-2.5 text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-200" />
                  Save Lead (Offline Ready)
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Quick Lead Qualification Modal (5-second flow for Scanned Badges) */}
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
                className="flex-1 font-bold"
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
