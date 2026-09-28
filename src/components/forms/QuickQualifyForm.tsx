'use client';

import React, { useState } from 'react';
import { Attendee, LeadRating, PurchaseTimeline, Lead } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Flame, Clock, Tag, FileText, CheckCircle2, User, Building2, Mail, Phone, MapPin, Sparkles } from 'lucide-react';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';

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

  const productOptions = [
    'Enterprise AI Platform',
    'Cloud Infrastructure & Security',
    'Smart Analytics & CRM Suite',
    'Cybersecurity & Compliance',
    'Custom Software Services',
  ];

  const ratingOptions: { value: LeadRating; label: string; icon: string; color: string }[] = [
    { value: 'hot', label: 'HOT (Urgent)', icon: '🔥', color: 'border-red-500 bg-red-50 text-red-700' },
    { value: 'warm', label: 'WARM (Active)', icon: '☀️', color: 'border-amber-500 bg-amber-50 text-amber-800' },
    { value: 'cold', label: 'COLD (Info)', icon: '❄️', color: 'border-sky-500 bg-sky-50 text-sky-700' },
  ];

  const timelineOptions: { value: PurchaseTimeline; label: string }[] = [
    { value: 'immediate', label: 'Immediate (<30d)' },
    { value: '1-3 months', label: '1 - 3 Months' },
    { value: '3-6 months', label: '3 - 6 Months' },
    { value: '6-12 months', label: '6 - 12 Months' },
  ];

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

      // Instant local persistence into IndexedDB + automatic sync queue
      const savedLead = await saveLeadLocally(leadPayload);

      setSaveSuccess(true);
      setTimeout(() => {
        onSuccess(savedLead);
      }, 1200);
    } catch (err) {
      console.error('Error saving lead:', err);
      setIsSaving(false);
    }
  };

  if (saveSuccess) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Lead Saved!</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-xs">
          {attendee.first_name} {attendee.last_name} ({attendee.company})
        </p>
        <div className="mt-3">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Synced with Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Saved Offline — Will Sync Automatically
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Attendee Profile Header */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900">
                {attendee.first_name} {attendee.last_name}
              </h4>
              {attendee.visitor_type && (
                <Badge variant="vip" size="sm">
                  {attendee.visitor_type}
                </Badge>
              )}
            </div>
            <p className="text-xs font-semibold text-blue-600 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{attendee.company || 'Private Enterprise'}</span>
            </p>
            {attendee.job_title && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5" />
                <span>{attendee.job_title}</span>
              </p>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
            {attendee.badge_id.slice(-5)}
          </span>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          {attendee.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-400" />
              {attendee.email}
            </span>
          )}
          {attendee.mobile && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {attendee.mobile}
            </span>
          )}
          {attendee.country && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {attendee.country}
            </span>
          )}
        </div>
      </div>

      {/* 1. Fast Rating Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Lead Temperature Rating</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ratingOptions.map((r) => {
            const isSelected = rating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRating(r.value)}
                className={`py-2 px-1 text-xs font-bold rounded-lg border-2 transition text-center flex flex-col items-center justify-center gap-0.5 ${
                  isSelected ? `${r.color} shadow-sm ring-1 ring-current` : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-blue-500" />
          <span>Product of Interest</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {productOptions.map((p) => {
            const isSelected = productInterest === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setProductInterest(p)}
                className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition border ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
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
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Purchase Timeline</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {timelineOptions.map((t) => {
            const isSelected = purchaseTimeline === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setPurchaseTimeline(t.value)}
                className={`py-2 px-2 text-xs font-medium rounded-lg text-center transition border ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Note & Follow-up toggle */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Quick Note (Optional)</span>
        </label>
        <textarea
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          placeholder="e.g. Requested RFP, looking for Arabic NLP, budget approved..."
          rows={2}
          className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-3">
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
          className="flex-[2] py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          <Sparkles className="w-4 h-4 mr-1 text-sky-200" />
          Save Qualified Lead
        </Button>
      </div>
    </div>
  );
}
