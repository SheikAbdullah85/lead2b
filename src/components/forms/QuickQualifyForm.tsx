'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Attendee, LeadRating, PurchaseTimeline, Lead } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Flame, Clock, Tag, FileText, CheckCircle2, User, Building2, Mail, Phone, MapPin, Sparkles, Mic, Volume2 } from 'lucide-react';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import {
  createSpeechRecognizer,
  SpeechRecognizerController,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  speakText,
  stopSpeaking,
  parseNaturalLanguageText,
} from '@/lib/utils/speech';

interface QuickQualifyFormProps {
  attendee: Attendee;
  onSuccess: (savedLead: Lead) => void;
  onCancel: () => void;
}

export function QuickQualifyForm({ attendee, onSuccess, onCancel }: QuickQualifyFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<LeadRating>('warm');
  const [productInterest, setProductInterest] = useState('Enterprise AI Platform');
  const [purchaseTimeline, setPurchaseTimeline] = useState<PurchaseTimeline>('1-3 months');
  const [quickNote, setQuickNote] = useState('');
  const [isFollowupRequired, setIsFollowupRequired] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isSpeakingNote, setIsSpeakingNote] = useState(false);
  const recognizerRef = useRef<SpeechRecognizerController | null>(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
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
    { value: 'hot', label: 'HOT (Urgent)', icon: '🔥', activeClass: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/30' },
    { value: 'warm', label: 'WARM (Active)', icon: '☀️', activeClass: 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/30' },
    { value: 'cold', label: 'COLD (Info)', icon: '❄️', activeClass: 'border-teal-500 bg-teal-50 text-teal-800 ring-2 ring-teal-500/30' },
  ];

  const timelineOptions: { value: PurchaseTimeline; label: string }[] = [
    { value: 'immediate', label: 'Immediate (<30d)' },
    { value: '1-3 months', label: '1 - 3 Months' },
    { value: '3-6 months', label: '3 - 6 Months' },
    { value: '6-12 months', label: '6 - 12 Months' },
  ];

  const handleToggleVoiceInput = () => {
    if (isListeningVoice) {
      recognizerRef.current?.stop();
      setIsListeningVoice(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognizer = createSpeechRecognizer({
      continuous: true,
      interimResults: true,
      onResult: (finalText, interim) => {
        const full = (finalText || interim).trim();
        if (full) {
          setQuickNote(full);
          const parsed = parseNaturalLanguageText(full);
          if (parsed.rating) setRating(parsed.rating);
          if (parsed.product_interest) setProductInterest(parsed.product_interest);
          if (parsed.purchase_timeline) setPurchaseTimeline(parsed.purchase_timeline);
        }
      },
      onEnd: () => setIsListeningVoice(false),
      onError: () => setIsListeningVoice(false),
    });

    if (recognizer) {
      recognizerRef.current = recognizer;
      setIsListeningVoice(true);
      recognizer.start();
    }
  };

  const handleTogglePlayNote = () => {
    if (isSpeakingNote) {
      stopSpeaking();
      setIsSpeakingNote(false);
      return;
    }
    if (!quickNote.trim()) return;
    setIsSpeakingNote(true);
    speakText(quickNote.trim(), {
      onEnd: () => setIsSpeakingNote(false),
      onError: () => setIsSpeakingNote(false),
    });
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
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        full_name: `${attendee.first_name} ${attendee.last_name}`,
        company: attendee.company || '',
        job_title: attendee.job_title || '',
        email: attendee.email,
        mobile: attendee.mobile || '',
        country: attendee.country || '',
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

      const savedLead = await saveLeadLocally(leadPayload);

      setSaveSuccess(true);
      setTimeout(() => {
        onSuccess(savedLead);
      }, 1000);
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
        <h3 className="text-xl font-black text-slate-900">Lead Saved!</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs font-medium">
          {attendee.first_name} {attendee.last_name} ({attendee.company})
        </p>
        <div className="mt-4">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Synced with Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Saved Offline — Will Sync Automatically
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Attendee Profile Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-50 to-teal-50/40 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-black text-slate-900">
                {attendee.first_name} {attendee.last_name}
              </h4>
              {attendee.visitor_type && (
                <Badge variant="vip" size="sm">
                  {attendee.visitor_type}
                </Badge>
              )}
            </div>
            <p className="text-xs font-bold text-[#00838f] flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{attendee.company || 'Enterprise Visitor'}</span>
            </p>
            {attendee.job_title && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                <User className="w-3.5 h-3.5" />
                <span>{attendee.job_title}</span>
              </p>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
            {attendee.badge_id.slice(-5)}
          </span>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
          {attendee.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              <span className="font-mono text-[11px]">{attendee.email}</span>
            </span>
          )}
          {attendee.mobile && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{attendee.mobile}</span>
            </span>
          )}
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

      {/* 4. Quick Note & Voice Note */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Quick Note & Voice Note</span>
          </label>
          <div className="flex items-center gap-1.5">
            {isSpeechRecognitionSupported() && (
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                  isListeningVoice
                    ? 'bg-rose-600 text-white animate-pulse shadow-sm'
                    : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200/80'
                }`}
                title="Speak to dictate note and auto-qualify"
              >
                <Mic className={`w-3.5 h-3.5 ${isListeningVoice ? 'animate-bounce' : 'text-brand-600'}`} />
                <span>{isListeningVoice ? 'Listening...' : 'Speak Note'}</span>
              </button>
            )}

            {isSpeechSynthesisSupported() && quickNote.trim() && (
              <button
                type="button"
                onClick={handleTogglePlayNote}
                className={`p-1 px-2 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                  isSpeakingNote
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Convert note text to Voice Note (TTS)"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px]">{isSpeakingNote ? 'Stop' : 'Play Note'}</span>
              </button>
            )}
          </div>
        </div>

        <textarea
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          placeholder="Speak or type details. Say e.g. 'Very hot lead, wants demo next week for Enterprise AI' to auto-classify..."
          rows={2}
          className={`w-full text-xs rounded-xl border p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00838f] transition ${
            isListeningVoice ? 'border-rose-400 ring-2 ring-rose-400/30 bg-rose-50/20' : 'border-slate-300'
          }`}
        />
        {isListeningVoice && (
          <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Listening... Speak in natural language to auto-classify lead temperature and solution.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          className="flex-[2] py-3 text-sm font-black shadow-lg shadow-teal-700/30"
        >
          <Sparkles className="w-4 h-4 mr-1 text-cyan-200" />
          Save Qualified Lead
        </Button>
      </div>
    </div>
  );
}
