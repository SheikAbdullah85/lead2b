'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Attendee, LeadRating, PurchaseTimeline, Lead } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Flame,
  Clock,
  Tag,
  FileText,
  CheckCircle2,
  User,
  Building2,
  Mail,
  Phone,
  Sparkles,
  Mic,
  MicOff,
  PackageCheck,
  Check,
  Edit3,
} from 'lucide-react';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import { DEFAULT_COLLATERAL_ASSETS, dispatchCollateralToLead } from '@/lib/collateral/collateral-store';
import {
  createSpeechRecognizer,
  SpeechRecognizerController,
  isSpeechRecognitionSupported,
  parseNaturalLanguageText,
} from '@/lib/utils/speech';

interface QuickQualifyFormProps {
  attendee: Attendee;
  onSuccess: (savedLead: Lead) => void;
  onCancel: () => void;
}

export function QuickQualifyForm({ attendee, onSuccess, onCancel }: QuickQualifyFormProps) {
  const { user } = useAuth();

  // Editable Contact Fields (ensures fast onboarding even when organizer attendee DB is not accessible)
  const [firstName, setFirstName] = useState(attendee.first_name || '');
  const [lastName, setLastName] = useState(attendee.last_name || '');
  const [company, setCompany] = useState(attendee.company || '');
  const [jobTitle, setJobTitle] = useState(attendee.job_title || '');
  const [email, setEmail] = useState(attendee.email || '');
  const [mobile, setMobile] = useState(attendee.mobile || '');

  // Qualification State
  const [rating, setRating] = useState<LeadRating>('warm');
  const [productInterest, setProductInterest] = useState('Enterprise AI Platform');
  const [purchaseTimeline, setPurchaseTimeline] = useState<PurchaseTimeline>('1-3 months');
  const [quickNote, setQuickNote] = useState('');
  const [isFollowupRequired, setIsFollowupRequired] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedCollateralIds, setSelectedCollateralIds] = useState<string[]>([]);

  // Voice to Fill Form State
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechRecognizerController | null>(null);

  const toggleCollateral = (id: string) => {
    setSelectedCollateralIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    return () => {
      recognizerRef.current?.abort();
    };
  }, []);

  const productOptions = [
    'Enterprise AI Platform',
    'Cloud Infrastructure & Security',
    'Smart Analytics & CRM Suite',
    'Cybersecurity & Compliance',
    'Custom Software Services',
  ];

  const ratingOptions: { value: LeadRating; label: string; icon: string; activeClass: string }[] = [
    {
      value: 'hot',
      label: 'HOT (Urgent)',
      icon: '🔥',
      activeClass: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/30',
    },
    {
      value: 'warm',
      label: 'WARM (Active)',
      icon: '☀️',
      activeClass: 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/30',
    },
    {
      value: 'cold',
      label: 'COLD (Info)',
      icon: '❄️',
      activeClass: 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/30',
    },
  ];

  const timelineOptions: { value: PurchaseTimeline; label: string }[] = [
    { value: 'immediate', label: 'Immediate (<30d)' },
    { value: '1-3 months', label: '1 - 3 Months' },
    { value: '3-6 months', label: '3 - 6 Months' },
    { value: '6-12 months', label: '6 - 12 Months' },
  ];

  // 1-Tap "Voice to Fill Form" handler
  const handleToggleVoiceToFillForm = () => {
    if (isListeningVoice) {
      recognizerRef.current?.stop();
      setIsListeningVoice(false);
      return;
    }

    setVoiceNotice(null);
    if (!isSpeechRecognitionSupported()) {
      setVoiceNotice('Microphone speech recognition is not supported in this browser. Please enter details manually.');
      return;
    }

    const recognizer = createSpeechRecognizer({
      continuous: true,
      interimResults: true,
      onResult: (finalText, interim) => {
        const full = (finalText ? finalText + ' ' + interim : interim).trim();
        if (full) {
          const parsed = parseNaturalLanguageText(full);
          if (parsed.first_name) setFirstName(parsed.first_name);
          if (parsed.last_name && parsed.last_name !== 'Visitor') setLastName(parsed.last_name);
          if (parsed.company) setCompany(parsed.company);
          if (parsed.job_title) setJobTitle(parsed.job_title);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.mobile) setMobile(parsed.mobile);
          if (parsed.rating) setRating(parsed.rating);
          if (parsed.product_interest) setProductInterest(parsed.product_interest);
          if (parsed.purchase_timeline) setPurchaseTimeline(parsed.purchase_timeline);
          setQuickNote(full);
        }
      },
      onError: (friendlyError) => {
        setVoiceNotice(friendlyError);
        setIsListeningVoice(false);
      },
      onEnd: () => setIsListeningVoice(false),
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      setIsListeningVoice(true);
      recognizer.start();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      const leadPayload: Omit<Lead, 'id' | 'local_id' | 'sync_status'> = {
        tenant_id: user?.tenant_id || '11111111-1111-1111-1111-111111111111',
        event_id: attendee.event_id,
        attendee_id: attendee.id,
        captured_by: user?.id || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        captured_by_name: user?.full_name || 'Tariq Mansoor',
        booth_id: 'b0001111-1111-1111-1111-111111111111',
        first_name: firstName.trim() || 'Visitor',
        last_name: lastName.trim() || '',
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim() || 'Exhibition Visitor',
        company: company.trim() || 'Visitor Company',
        job_title: jobTitle.trim() || 'Representative',
        email: email.trim(),
        mobile: mobile.trim(),
        country: attendee.country || 'United Arab Emirates',
        industry: attendee.industry || '',
        source: 'qr_scan',
        rating,
        status: rating === 'hot' ? 'demo_required' : 'follow_up',
        priority: rating === 'hot' ? 'high' : 'medium',
        product_interest: productInterest,
        requirement: quickNote,
        purchase_timeline: purchaseTimeline,
        followup_required: isFollowupRequired,
        followup_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        capture_method: attendee.source === 'card_ocr' ? 'business_card' : attendee.source === 'badge_ocr' ? 'badge' : 'QR',
        captured_at: new Date().toISOString(),
        online_offline: isOnline ? 'online' : 'offline',
        collateral_sent: selectedCollateralIds,
        consent_status: true,
        email_marketing_consent: true,
        privacy_policy_accepted: true,
        consent_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const savedLead = await saveLeadLocally(leadPayload);

      // Trigger digital collateral dispatch if selected
      if (selectedCollateralIds.length > 0 && email.trim()) {
        dispatchCollateralToLead({
          leadId: savedLead.id,
          leadEmail: email.trim(),
          leadName: `${firstName.trim()} ${lastName.trim()}`.trim(),
          assetIds: selectedCollateralIds,
          sentByUserId: user?.id,
          sentByName: user?.full_name,
        }).catch((err) => console.warn('Collateral dispatch error:', err));
      }

      setSaveSuccess(true);
      setTimeout(() => {
        onSuccess(savedLead);
      }, 1100);
    } catch (err) {
      console.error('Error saving lead:', err);
      setIsSaving(false);
    }
  };

  if (saveSuccess) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return (
      <div className="py-10 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-slate-900">Visitor Lead Saved!</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs font-medium">
          {firstName} {lastName} ({company})
        </p>

        {selectedCollateralIds.length > 0 && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Check className="w-3.5 h-3.5 text-teal-600" />
            <span>Dispatched {selectedCollateralIds.length} collateral doc(s)</span>
          </div>
        )}

        <div className="mt-4">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Synced with Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Saved Offline — Syncs Automatically
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Top Action Bar: Voice to Fill Form Banner */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00838f] text-white flex items-center justify-center">
            <Mic className={`w-3.5 h-3.5 ${isListeningVoice ? 'animate-bounce text-cyan-200' : ''}`} />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-900 block leading-tight">
              Voice-to-Form Dictation
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Speak details to auto-populate open fields
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleVoiceToFillForm}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
            isListeningVoice
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-[#00838f] text-white hover:brightness-105 active:scale-95'
          }`}
        >
          {isListeningVoice ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Done Dictating</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Voice to Fill</span>
            </>
          )}
        </button>
      </div>

      {/* Voice Listening Notice */}
      {isListeningVoice && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 font-medium flex items-center gap-2 animate-in fade-in-50">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <span>
            Listening... Speak e.g. &ldquo;John Doe, Acme Corp, email john@acme.com, mobile 0501234567, hot lead for Enterprise AI&rdquo;
          </span>
        </div>
      )}

      {voiceNotice && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
          {voiceNotice}
        </div>
      )}

      {/* Editable Contact Fields (Badge OCR / Scan Result) */}
      <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
          <div className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-[#00838f]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Visitor Contact Details
            </span>
          </div>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            Open for Editing
          </span>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Tariq"
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Mansoor"
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30"
            />
          </div>
        </div>

        {/* Company & Job Title */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
              Company / Organization *
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. ADNOC Distribution"
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-0.5">
              Job Title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Head of Operations"
              className="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30"
            />
          </div>
        </div>

        {/* Mobile & Email (Remaining Fields To Fill) */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-teal-800 mb-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#00838f]" />
              <span>Mobile Number</span>
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. +971 50 123 4567"
              className="w-full text-xs font-mono font-semibold rounded-lg border border-teal-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-teal-800 mb-0.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#00838f]" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="visitor@company.com"
              className="w-full text-xs font-mono font-semibold rounded-lg border border-teal-300 p-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#00838f]/30"
            />
          </div>
        </div>
      </div>

      {/* 1. Fast Rating Selector */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span>Lead Temperature Rating *</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ratingOptions.map((r) => {
            const isSelected = rating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRating(r.value)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border-2 transition text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  isSelected ? r.activeClass : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Product Interest */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-[#00838f]" />
          <span>Primary Solution of Interest</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {productOptions.map((p) => {
            const isSelected = productInterest === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProductInterest(p)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl text-left transition border cursor-pointer ${
                  isSelected
                    ? 'border-[#00838f] bg-teal-50/70 text-teal-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Purchase Timeline */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Expected Buying Timeline</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {timelineOptions.map((t) => {
            const isSelected = purchaseTimeline === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setPurchaseTimeline(t.value)}
                className={`py-2 px-1.5 text-xs font-bold rounded-xl text-center transition border cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Booth Notes */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Booth Discussion & Requirement Notes</span>
        </label>
        <textarea
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          placeholder="Type or dictate conversation details, specific questions, or follow-up needs..."
          rows={2}
          className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00838f] bg-white transition"
        />
      </div>

      {/* 5. Instant Digital Collateral Fulfillment */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
            <PackageCheck className="w-4 h-4 text-[#00838f]" />
            <span>Send Digital Collateral</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">Instant PDF dispatch</span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          {DEFAULT_COLLATERAL_ASSETS.map((asset) => {
            const isChecked = selectedCollateralIds.includes(asset.id);
            return (
              <label
                key={asset.id}
                onClick={() => toggleCollateral(asset.id)}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                  isChecked
                    ? 'bg-teal-50/80 border-[#00838f] text-teal-900 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                      isChecked ? 'bg-[#00838f] border-[#00838f] text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{asset.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{asset.file_size}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 font-bold text-xs py-3 border-slate-300 text-slate-700 hover:bg-slate-100"
          disabled={isSaving}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          className="flex-2 font-black text-xs py-3 shadow-md bg-gradient-to-r from-[#006d77] to-[#00838f] text-white hover:brightness-105 active:scale-98"
        >
          Save &amp; Qualify Visitor
        </Button>
      </div>
    </div>
  );
}
