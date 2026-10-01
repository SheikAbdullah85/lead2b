'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrScannerView } from '@/components/scanner/QrScannerView';
import { QuickQualifyForm } from '@/components/forms/QuickQualifyForm';
import { Attendee, Lead, LeadNote, LeadRating, PriorityLevel, PurchaseTimeline } from '@/lib/types';
import { localDb } from '@/lib/db/dexie';
import { INITIAL_ATTENDEES, INITIAL_LEADS } from '@/lib/data/mock-store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { parseBadgeQr } from '@/lib/utils/qr-parser';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
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
  Zap,
  Layers,
  RefreshCw,
  Clock,
  Mic,
  Check,
} from 'lucide-react';
import { playSuccessBeep, playWarningBeep } from '@/lib/utils/sound';
import { NaturalLanguageVoiceInput } from '@/components/audio/NaturalLanguageVoiceInput';
import { ParsedNaturalLanguageLead } from '@/lib/utils/speech';
import { preprocessCardForOcr } from '@/lib/ocr/card-preprocessor';
import { parseBusinessCardText } from '@/lib/ocr/card-parser';

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Mode: Camera QR Scanner vs. Physical Badge Photo OCR vs. Direct Manual & Voice Form
  const [activeTab, setActiveTab] = useState<'scan' | 'badge_ocr' | 'manual'>('scan');

  // Badge Photo OCR states
  const badgeCameraInputRef = useRef<HTMLInputElement>(null);
  const badgeGalleryInputRef = useRef<HTMLInputElement>(null);
  const [badgeImagePreview, setBadgeImagePreview] = useState<string | null>(null);
  const [isProcessingBadgeOcr, setIsProcessingBadgeOcr] = useState(false);
  const [badgeOcrStatus, setBadgeOcrStatus] = useState('');
  const [badgeOcrError, setBadgeOcrError] = useState<string | null>(null);

  // Batch / Continuous Scan Mode state
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchDefaultRating, setBatchDefaultRating] = useState<LeadRating>('warm');
  const [batchFeed, setBatchFeed] = useState<Lead[]>([]);
  const [batchNotice, setBatchNotice] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const lastScanTimeRef = useRef<{ badge: string; time: number }>({ badge: '', time: 0 });

  // Scanner states
  const [scannedAttendee, setScannedAttendee] = useState<Attendee | null>(null);
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);
  const [manualQuery, setManualQuery] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);

  // Process Photo of Physical Badge via OCR
  const handleProcessBadgeImage = async (fileOrUrl: File | string) => {
    setIsProcessingBadgeOcr(true);
    setBadgeOcrStatus('Optimizing badge image contrast...');
    setBadgeOcrError(null);

    try {
      if (typeof fileOrUrl !== 'string') {
        const preview = URL.createObjectURL(fileOrUrl);
        setBadgeImagePreview(preview);
      } else {
        setBadgeImagePreview(fileOrUrl);
      }

      const ocrOptimizedDataUrl = await preprocessCardForOcr(fileOrUrl, {
        maxDimension: 2048,
        contrastBoost: 1.35,
        sharpen: true,
      });

      setBadgeOcrStatus('Scanning badge with on-device OCR...');

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setBadgeOcrStatus(`Reading badge text: ${pct}%`);
          }
        },
      });

      await worker.setParameters({
        preserve_interword_spaces: '1',
      });

      const ret = await worker.recognize(ocrOptimizedDataUrl);
      await worker.terminate();

      const extractedText = ret?.data?.text || '';

      if (!extractedText.trim()) {
        setBadgeOcrError('No legible text found on badge. Please retake photo with better lighting or enter details manually.');
        setIsProcessingBadgeOcr(false);
        return;
      }

      setBadgeOcrStatus('Extracting visitor name & organization...');
      const parsed = parseBusinessCardText(extractedText);

      const generatedAttUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'b0000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0');

      const ocrAttendee: Attendee = {
        id: generatedAttUuid,
        event_id: 'eeee1111-1111-1111-1111-111111111111',
        badge_id: 'OCR-' + Date.now().toString(36).toUpperCase().slice(-5),
        qr_token: 'ocr_badge_' + Date.now(),
        first_name: parsed.firstName || (parsed.fullName ? parsed.fullName.split(' ')[0] : 'Visitor'),
        last_name: parsed.lastName || (parsed.fullName ? parsed.fullName.split(' ').slice(1).join(' ') : ''),
        company: parsed.company || 'Exhibition Visitor',
        job_title: parsed.designation || 'Visitor',
        email: parsed.email || '',
        mobile: parsed.phone || '',
        website: parsed.website || '',
        visitor_type: 'Trade Visitor',
        consent_status: true,
        source: 'badge_ocr',
      };

      await localDb.attendees.put(ocrAttendee).catch(() => {});
      playSuccessBeep();
      setIsProcessingBadgeOcr(false);
      setBadgeOcrStatus('');
      setScannedAttendee(ocrAttendee);
    } catch (err: any) {
      console.error('Badge OCR error:', err);
      setBadgeOcrError('Unable to process badge image. Please retry or enter details manually.');
      setIsProcessingBadgeOcr(false);
    }
  };

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

  const handleApplyVoiceData = (data: ParsedNaturalLanguageLead) => {
    if (data.first_name) setFirstName(data.first_name);
    if (data.last_name) setLastName(data.last_name);
    if (data.company) setCompany(data.company);
    if (data.job_title) setJobTitle(data.job_title);
    if (data.email) setEmail(data.email);
    if (data.mobile) setMobile(data.mobile);
    if (data.rating) setRating(data.rating);
    if (data.priority) setPriority(data.priority);
    if (data.product_interest) setProductInterest(data.product_interest);
    if (data.purchase_timeline) setTimeline(data.purchase_timeline);
    if (data.raw_transcript) setNotes(data.raw_transcript);
  };

  // Duplicate Lead Re-engagement / Note Appending states
  const [appendNoteText, setAppendNoteText] = useState('');
  const [appendRating, setAppendRating] = useState<LeadRating | ''>('');
  const [isAppendingNote, setIsAppendingNote] = useState(false);
  const [appendSuccess, setAppendSuccess] = useState(false);

  const handleAppendInteractionNote = async () => {
    if (!duplicateLead || !appendNoteText.trim()) return;

    setIsAppendingNote(true);
    try {
      const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const repName = user?.full_name || 'Tariq Mansoor';
      const noteEntry: LeadNote = {
        id: noteId,
        lead_id: duplicateLead.id,
        tenant_id: duplicateLead.tenant_id,
        user_id: user?.id || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        user_name: repName,
        note_text: `📝 [Re-engagement by ${repName}]: ${appendNoteText.trim()}`,
        created_at: new Date().toISOString(),
        sync_status: 'pending',
      };

      // Save note to local Dexie
      await localDb.leadNotes.put(noteEntry);

      // Update lead's existing requirement text & optionally elevate rating
      const updatedRating = appendRating ? appendRating : duplicateLead.rating;
      const existingReq = duplicateLead.requirement ? `${duplicateLead.requirement}\n` : '';
      const updatedReq = `${existingReq}• [${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${repName}]: ${appendNoteText.trim()}`;

      await localDb.leads.where('id').equals(duplicateLead.id).modify((l) => {
        l.rating = updatedRating;
        l.requirement = updatedReq;
        l.updated_at = new Date().toISOString();
      });

      // Enqueue sync queue item
      await localDb.syncQueue.put({
        id: `queue_${noteId}`,
        tenant_id: duplicateLead.tenant_id,
        user_id: user?.id || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        idempotency_key: `note_idemp_${noteId}`,
        action: 'add_note',
        payload: noteEntry,
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString(),
      });

      playSuccessBeep();
      setAppendSuccess(true);
      setTimeout(() => {
        setAppendSuccess(false);
        setAppendNoteText('');
        setAppendRating('');
        setDuplicateLead(null);
        setScannedAttendee(null);
      }, 1500);
    } catch (err) {
      console.error('Error appending interaction note to duplicate lead:', err);
      alert('Failed to save note. Please retry.');
    } finally {
      setIsAppendingNote(false);
    }
  };

  // Handle scanned QR code text
  const handleQrDecoded = async (qrText: string) => {
    const parsed = parseBadgeQr(qrText);
    const badgeId = parsed.badgeId;

    // Helper to validate UUID
    const isUuid = (val?: string) =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

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

    // 1b. Check Supabase online if not found in local cache
    if (!matchedAttendee && typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { data: dbAtt } = await supabase
          .from('attendees')
          .select('*')
          .or(`badge_id.ilike.${badgeId},qr_token.eq.${qrText}`)
          .maybeSingle();

        if (dbAtt) {
          matchedAttendee = dbAtt as Attendee;
          await localDb.attendees.put(matchedAttendee).catch(() => {});
        }
      } catch (err) {
        console.warn('Online attendee lookup failed:', err);
      }
    }

    if (!matchedAttendee) {
      // Create on the fly with a valid UUID so PostgreSQL foreign keys are satisfied
      const generatedAttUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : 'a0000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0');

      matchedAttendee = {
        id: generatedAttUuid,
        event_id: 'eeee1111-1111-1111-1111-111111111111',
        badge_id: badgeId,
        qr_token: qrText,
        first_name: parsed.firstName || (parsed.fullName ? parsed.fullName.split(' ')[0] : 'Visitor'),
        last_name: parsed.lastName || (parsed.fullName ? parsed.fullName.split(' ').slice(1).join(' ') : 'Badge'),
        company: parsed.company || 'Exhibition Visitor',
        job_title: parsed.jobTitle || 'Visitor',
        email: parsed.email || `visitor_${badgeId.slice(-4).toLowerCase()}@event.example.com`,
        mobile: parsed.phone,
        website: parsed.website,
        visitor_type: (parsed.visitorType as any) || 'Trade Visitor',
        consent_status: true,
      };
      await localDb.attendees.put(matchedAttendee).catch(() => {});
    }

    // 2. Continuous Batch Scan Mode
    if (isBatchMode) {
      const now = Date.now();
      if (lastScanTimeRef.current.badge === badgeId && now - lastScanTimeRef.current.time < 3000) {
        return;
      }
      lastScanTimeRef.current = { badge: badgeId, time: now };

      // Duplicate Detection Check
      const localExisting = await localDb.leads
        .where('attendee_id')
        .equals(matchedAttendee.id)
        .first();
      const memExisting = INITIAL_LEADS.find((l) => l.attendee_id === matchedAttendee?.id);
      const existing = localExisting || memExisting;

      if (existing) {
        playWarningBeep();
        setBatchNotice({
          type: 'warning',
          message: `Already captured: ${matchedAttendee.first_name} ${matchedAttendee.last_name} (${matchedAttendee.company})`,
        });
        setTimeout(() => setBatchNotice(null), 3500);
        return;
      }

      // Instant auto-save and background cloud sync
      playSuccessBeep();
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      const leadPayload: Omit<Lead, 'id' | 'local_id' | 'sync_status'> = {
        tenant_id: user?.tenant_id || '11111111-1111-1111-1111-111111111111',
        event_id: matchedAttendee.event_id || 'eeee1111-1111-1111-1111-111111111111',
        attendee_id: isUuid(matchedAttendee.id) ? matchedAttendee.id : undefined,
        captured_by: user?.id || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        captured_by_name: user?.full_name || 'Tariq Mansoor',
        booth_id: 'b0001111-1111-1111-1111-111111111111',
        first_name: matchedAttendee.first_name,
        last_name: matchedAttendee.last_name || 'Visitor',
        full_name: `${matchedAttendee.first_name} ${matchedAttendee.last_name || 'Visitor'}`.trim(),
        company: matchedAttendee.company || 'Exhibition Visitor',
        job_title: matchedAttendee.job_title || 'Visitor',
        email: matchedAttendee.email || `badge_${badgeId.slice(-4).toLowerCase()}@event.example.com`,
        mobile: matchedAttendee.mobile || '',
        country: matchedAttendee.country || 'United Arab Emirates',
        industry: matchedAttendee.industry || '',
        source: 'qr_scan',
        rating: batchDefaultRating,
        status: batchDefaultRating === 'hot' ? 'demo_required' : 'new',
        priority: batchDefaultRating === 'hot' ? 'high' : 'medium',
        product_interest: 'Enterprise AI Platform',
        requirement: 'Rapid Batch Scan at booth',
        purchase_timeline: '1-3 months',
        followup_required: true,
        followup_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        capture_method: 'QR',
        captured_at: new Date().toISOString(),
        online_offline: isOnline ? 'online' : 'offline',
        consent_status: true,
        email_marketing_consent: true,
        privacy_policy_accepted: true,
        consent_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const savedLead = await saveLeadLocally(leadPayload);
        setBatchFeed((prev) => [savedLead as Lead, ...prev]);
        setBatchNotice({
          type: 'success',
          message: `✓ Batch Synced: ${matchedAttendee.first_name} ${matchedAttendee.last_name} (${matchedAttendee.company})`,
        });
        setTimeout(() => setBatchNotice(null), 3500);
      } catch (err) {
        console.error('Batch lead auto-save error:', err);
      }
      return;
    }

    // 3. Standard Mode: Duplicate Check & Open Qualification Form
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

    // Open Quick Qualify modal
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

      {/* Mode Switcher Tabs: QR Scanner vs. Badge Photo OCR vs. Manual Form */}
      <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('scan');
            setManualSaveSuccess(null);
          }}
          className={`py-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'scan'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <QrCode className="w-3.5 h-3.5 text-teal-600" />
          <span>QR Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('badge_ocr');
            setManualSaveSuccess(null);
          }}
          className={`py-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'badge_ocr'
              ? 'bg-[#00838f] text-white shadow-sm font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Badge OCR</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('manual');
            setManualSaveSuccess(null);
          }}
          className={`py-2 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'manual'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mic className="w-3.5 h-3.5 text-teal-600" />
          <span>Manual &amp; Voice</span>
        </button>
      </div>

      {/* VIEW 1: CAMERA SCANNER */}
      {activeTab === 'scan' && (
        <div className="space-y-3 animate-in fade-in-50 duration-150">
          {/* Continuous Batch Scan Toggle Card */}
          <div className="p-3 bg-gradient-to-r from-slate-900 to-brand-950 text-white rounded-2xl shadow-md border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isBatchMode ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                  <Zap className={`w-4 h-4 ${isBatchMode ? 'fill-current' : ''}`} />
                </div>
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span>Continuous Batch Scan</span>
                    {isBatchMode && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider font-extrabold animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isBatchMode
                      ? 'Camera stays live • Auto-saves & syncs in real-time'
                      : 'Opens qualify form on each scan'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBatchMode(!isBatchMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition shadow-sm ${
                  isBatchMode
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {isBatchMode ? 'ON' : 'Enable'}
              </button>
            </div>

            {/* Quick Rating Selector for Batch Mode */}
            {isBatchMode && (
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Default Rating:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBatchDefaultRating('hot')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                      batchDefaultRating === 'hot'
                        ? 'bg-rose-500 text-white shadow-sm ring-1 ring-white/30'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    🔥 Hot
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchDefaultRating('warm')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                      batchDefaultRating === 'warm'
                        ? 'bg-amber-500 text-white shadow-sm ring-1 ring-white/30'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    ☀️ Warm
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchDefaultRating('cold')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                      batchDefaultRating === 'cold'
                        ? 'bg-teal-500 text-white shadow-sm ring-1 ring-white/30'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    ❄️ Cold
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Notification Banner */}
          {batchNotice && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
                batchNotice.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border border-amber-300 text-amber-900'
              }`}
            >
              {batchNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{batchNotice.message}</span>
            </div>
          )}

          {/* Main Viewfinder Scanner */}
          <QrScannerView onScanSuccess={handleQrDecoded} isScanningActive={!scannedAttendee} />

          {/* Batch Scan Live Stream Feed */}
          {isBatchMode && batchFeed.length > 0 && (
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                  <span>Current Batch Session ({batchFeed.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => router.push('/app/leads')}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  View All Leads →
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {batchFeed.map((lead, idx) => (
                  <div key={lead.id || idx} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {lead.company} • {lead.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Synced
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Direct Link to Badge Photo OCR */}
          <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/90 rounded-2xl text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#00838f] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-900 font-bold text-xs block leading-tight">Badge has no QR Code?</span>
                <span className="text-slate-500 text-[10px]">Take a photo to OCR Name &amp; Organization</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              className="text-[11px] font-bold py-1.5 px-3 shadow-xs bg-[#00838f]"
              onClick={() => setActiveTab('badge_ocr')}
            >
              Badge OCR →
            </Button>
          </div>

          {/* Quick Direct Link to Manual Form / Voice Dictation */}
          <div className="flex items-center justify-between p-2.5 bg-cyan-50/70 border border-cyan-200/80 rounded-2xl text-xs">
            <div>
              <span className="text-cyan-950 font-bold text-[11px] block">No physical badge to scan?</span>
              <span className="text-cyan-700 text-[10px]">Use Voice Dictation or Manual Form</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] font-bold py-1.5 px-3 shadow-xs border-cyan-300 text-cyan-800"
              onClick={() => setActiveTab('manual')}
            >
              <Mic className="w-3.5 h-3.5 mr-1 text-cyan-600" />
              Voice &amp; Form
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

      {/* VIEW 2: BADGE PHOTO OCR SCANNER */}
      {activeTab === 'badge_ocr' && (
        <div className="space-y-3.5 animate-in fade-in-50 duration-150">
          {/* Badge OCR Guidance Header */}
          <div className="p-3.5 bg-gradient-to-br from-slate-900 via-slate-950 to-[#004d53] text-white rounded-2xl shadow-md border border-teal-800/40">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Physical Badge Reader
                </span>
                <h3 className="text-base font-black text-white mt-0.5">Photo Badge OCR</h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  Snap or upload a photo of the visitor badge to automatically extract Name, Company, and Job Title. Remaining fields remain open to enter or dictate.
                </p>
              </div>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={badgeCameraInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleProcessBadgeImage(file);
            }}
          />
          <input
            type="file"
            accept="image/*"
            ref={badgeGalleryInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleProcessBadgeImage(file);
            }}
          />

          {/* Action Trigger Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isProcessingBadgeOcr}
              onClick={() => badgeCameraInputRef.current?.click()}
              className="py-4 px-3 rounded-2xl bg-gradient-to-r from-[#006d77] to-[#00838f] text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <Camera className="w-6 h-6 text-cyan-200 stroke-[2.2]" />
              <span>Take Badge Photo</span>
            </button>

            <button
              type="button"
              disabled={isProcessingBadgeOcr}
              onClick={() => badgeGalleryInputRef.current?.click()}
              className="py-4 px-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-2xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-6 h-6 text-brand-600 stroke-[2.2]" />
              <span>Choose from Gallery</span>
            </button>
          </div>

          {/* Live OCR Processing Indicator */}
          {isProcessingBadgeOcr && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-center space-y-2.5 animate-in fade-in-50">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-xs font-black text-teal-900">{badgeOcrStatus || 'Scanning Badge...'}</p>
                <p className="text-[10px] text-teal-700 mt-0.5">On-device neural OCR extracting contact details</p>
              </div>
            </div>
          )}

          {/* Badge OCR Error */}
          {badgeOcrError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{badgeOcrError}</p>
                <button
                  type="button"
                  onClick={() => badgeCameraInputRef.current?.click()}
                  className="mt-1 text-[11px] font-bold text-[#00838f] underline cursor-pointer"
                >
                  Retake Photo →
                </button>
              </div>
            </div>
          )}

          {/* Badge Image Preview if captured */}
          {badgeImagePreview && (
            <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Captured Badge Image:
              </span>
              <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={badgeImagePreview}
                  alt="Badge Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Sample Badge Test Button */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block text-[11px]">Testing without a physical badge?</span>
              <span className="text-slate-500 text-[10px]">Load sample badge data instantly</span>
            </div>
            <button
              type="button"
              disabled={isProcessingBadgeOcr}
              onClick={() => {
                const sampleBadgeAttendee: Attendee = {
                  id: 'att_sample_' + Date.now(),
                  event_id: 'eeee1111-1111-1111-1111-111111111111',
                  badge_id: 'BADGE-' + Math.floor(1000 + Math.random() * 9000),
                  qr_token: 'sample_badge_qr',
                  first_name: 'Dr. Sarah',
                  last_name: 'Jenkins',
                  company: 'Cleveland Clinic Abu Dhabi',
                  job_title: 'VP of Health Informatics',
                  email: 'sarah.jenkins@clevelandclinic.ae',
                  mobile: '+971 50 123 4567',
                  visitor_type: 'VIP Delegate',
                  consent_status: true,
                  source: 'badge_ocr',
                };
                playSuccessBeep();
                setScannedAttendee(sampleBadgeAttendee);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[11px] hover:bg-slate-100 transition cursor-pointer"
            >
              Test Sample Badge
            </button>
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

              {/* Natural Language Voice Dictation & Audio Note Assistant */}
              <NaturalLanguageVoiceInput
                onApplyExtractedData={handleApplyVoiceData}
                defaultExpanded={true}
              />

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

      {/* Duplicate Lead Detection & Smart Re-Engagement Modal */}
      <Modal
        isOpen={!!duplicateLead}
        onClose={() => setDuplicateLead(null)}
        title="Visitor Previously Captured"
      >
        {duplicateLead && (
          <div className="space-y-3.5 text-left">
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold leading-tight">
                  {duplicateLead.first_name} {duplicateLead.last_name} was already captured at our booth!
                </p>
                <p className="text-[11px] text-amber-700 mt-1">
                  Scanned on{' '}
                  <span className="font-semibold">
                    {new Date(duplicateLead.captured_at || duplicateLead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>{' '}
                  by <span className="font-semibold text-amber-900">{duplicateLead.captured_by_name || 'Booth Rep'}</span>.
                </p>
              </div>
            </div>

            {/* Existing Profile Snippet */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <p className="font-black text-slate-900">{duplicateLead.first_name} {duplicateLead.last_name}</p>
                <p className="text-slate-500 text-[11px]">{duplicateLead.company} • {duplicateLead.job_title}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{duplicateLead.email}</p>
              </div>
              <div className="text-right">
                <Badge variant={duplicateLead.rating as any} size="sm">
                  {duplicateLead.rating.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Smart Interaction Note Appender (Prevents Duplicate Records) */}
            <div className="p-3.5 bg-gradient-to-br from-brand-50/60 to-indigo-50/40 rounded-xl border border-brand-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-brand-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Append New Interaction Note
                </span>
                <span className="text-[10px] text-brand-700 font-bold bg-brand-100/70 px-2 py-0.5 rounded-full">
                  Keep Single Lead ID
                </span>
              </div>

              <textarea
                value={appendNoteText}
                onChange={(e) => setAppendNoteText(e.target.value)}
                placeholder="Spoke again at demo station, asked about custom integrations, upgrade interest..."
                rows={2}
                className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />

              {/* Rating Elevation */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Elevate Priority (Optional):
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 'hot', label: '🔥 Upgrade to Hot' },
                    { val: 'warm', label: '☀️ Keep as Warm' },
                    { val: 'cold', label: '❄️ Cold' },
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setAppendRating(appendRating === r.val ? '' : (r.val as any))}
                      className={`py-1.5 text-[10px] font-bold rounded-lg border transition ${
                        appendRating === r.val
                          ? 'border-brand-600 bg-brand-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {appendSuccess ? (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Interaction Note Appended to Existing Lead!</span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAppendInteractionNote}
                  disabled={!appendNoteText.trim() || isAppendingNote}
                  isLoading={isAppendingNote}
                  className="w-full font-bold text-xs shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1 text-cyan-200" />
                  Append Note &amp; Update Record
                </Button>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setDuplicateLead(null)}
              >
                Scan Next Visitor
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs font-bold"
                onClick={() => router.push(`/app/lead/${duplicateLead.id}`)}
              >
                View Full Lead Profile →
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
