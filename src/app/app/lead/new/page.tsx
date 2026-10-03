'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import { Lead, LeadRating, PriorityLevel, PurchaseTimeline } from '@/lib/types';
import { ArrowLeft, UserPlus, Flame, Sparkles, Building2, CheckCircle2, WifiOff, ListFilter, Mic } from 'lucide-react';
import { NaturalLanguageVoiceInput } from '@/components/audio/NaturalLanguageVoiceInput';
import { ParsedNaturalLanguageLead } from '@/lib/utils/speech';
import { getActiveEvent, getActiveTenant } from '@/lib/events/active-event';

export default function ManualLeadPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [country, setCountry] = useState('United Arab Emirates');
  const [productInterest, setProductInterest] = useState('Enterprise AI Platform');
  const [rating, setRating] = useState<LeadRating>('warm');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [timeline, setTimeline] = useState<PurchaseTimeline>('1-3 months');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedLead, setSavedLead] = useState<Lead | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      alert('First name and last name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const activeEvt = getActiveEvent();
      const activeTnt = getActiveTenant();

      const leadPayload: Omit<Lead, 'id' | 'local_id' | 'sync_status'> = {
        tenant_id: user?.tenant_id || activeTnt.id,
        event_id: activeEvt.id,
        captured_by: user?.id || 'd1c88448-0a1a-4b35-8f50-32aea5420067',
        captured_by_name: user?.full_name || 'Sheik Abdullah',
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        company: company.trim(),
        job_title: jobTitle.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        country,
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
      setSavedLead(saved);
    } catch (err) {
      console.error('Error saving manual lead offline:', err);
      alert('Could not save lead to local offline storage. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSavedLead(null);
    setFirstName('');
    setLastName('');
    setCompany('');
    setJobTitle('');
    setEmail('');
    setMobile('');
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-12">
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
          <UserPlus className="w-3.5 h-3.5 text-brand-600" />
          <span>Manual Entry</span>
        </span>
      </div>

      {savedLead ? (
        /* Instant Offline-Safe Success Screen */
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Lead Saved Successfully!</h2>
            <p className="text-sm font-bold text-slate-700 mt-1">
              {savedLead.first_name} {savedLead.last_name} {savedLead.company ? `(${savedLead.company})` : ''}
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              {typeof navigator !== 'undefined' && navigator.onLine
                ? 'Saved & Synced to Cloud Database'
                : 'Saved in Offline Vault — Syncs on Connect'}
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-2.5">
            <Button
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md"
              onClick={resetForm}
            >
              <UserPlus className="w-4 h-4 mr-1.5 text-cyan-200" />
              + Enter Another Visitor Lead
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="w-full font-bold"
              onClick={() => router.push('/app/leads')}
            >
              <ListFilter className="w-4 h-4 mr-1.5" />
              View All Captured Leads
            </Button>

            <Button
              variant="outline"
              size="md"
              className="w-full text-xs font-semibold"
              onClick={() => router.push('/app/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* Manual Lead Entry Form */
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-tight">Create New Visitor Lead</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant offline-first entry for walk-ins or visitors without printed badges
            </p>
          </div>

          {/* Natural Language Voice Dictation & Audio Note Assistant */}
          <NaturalLanguageVoiceInput
            onApplyExtractedData={handleApplyVoiceData}
            defaultExpanded={true}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
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

            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Global Tech LLC"
              />
              <Input
                label="Job Designation"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Director of IT"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="david@globaltech.com"
              />
              <Input
                label="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+971 50 123 4567"
              />
            </div>

            {/* Lead Rating Chips */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Lead Rating Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'hot', label: '🔥 Hot Lead', activeClass: 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200' },
                  { val: 'warm', label: '☀️ Warm Lead', activeClass: 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200' },
                  { val: 'cold', label: '❄️ Cold Lead', activeClass: 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-200' },
                ].map((r) => (
                  <button
                    key={r.val}
                    type="button"
                    onClick={() => setRating(r.val as any)}
                    className={`py-2.5 text-xs font-black rounded-xl border transition ${
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

            {/* Product of Interest */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Primary Product of Interest
              </label>
              <select
                value={productInterest}
                onChange={(e) => setProductInterest(e.target.value)}
                className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="Enterprise AI Platform">Enterprise AI Platform</option>
                <option value="Cloud Infrastructure & Security">Cloud Infrastructure & Security</option>
                <option value="Smart Analytics & CRM Suite">Smart Analytics & CRM Suite</option>
                <option value="Custom Software Development">Custom Software Development</option>
              </select>
            </div>

            {/* Purchase Timeline */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Buying Timeline
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'immediate', label: 'Immediate (<30d)' },
                  { val: '1-3 months', label: '1 - 3 Months' },
                  { val: '3-6 months', label: '3 - 6 Months' },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() => setTimeline(t.val as any)}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition ${
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Booth Conversation & Key Requirements
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Met at booth stand, requested quotation for 50 licenses..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSaving}
              className="w-full font-bold shadow-md py-3 text-sm"
            >
              <Sparkles className="w-4 h-4 mr-1 text-cyan-200" />
              Save Visitor Lead (Offline Ready)
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
