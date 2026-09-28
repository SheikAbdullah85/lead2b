'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import { Lead, LeadRating, PriorityLevel, PurchaseTimeline } from '@/lib/types';
import { ArrowLeft, UserPlus, Flame, Sparkles } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      alert('First and last name are required.');
      return;
    }

    setIsSaving(true);
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      const leadPayload: Omit<Lead, 'id' | 'local_id' | 'sync_status'> = {
        tenant_id: user?.tenant_id || '11111111-1111-1111-1111-111111111111',
        event_id: 'eeee1111-1111-1111-1111-111111111111',
        captured_by: user?.id || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        captured_by_name: user?.full_name || 'Tariq Mansoor',
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        company,
        job_title: jobTitle,
        email,
        mobile,
        country,
        source: 'manual',
        rating,
        status: 'new',
        priority,
        product_interest: productInterest,
        purchase_timeline: timeline,
        requirement: notes,
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
      router.push(`/app/lead/${saved.id}`);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
          <UserPlus className="w-3.5 h-3.5 text-blue-600" /> Manual Lead Entry
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            placeholder="e.g. David"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            placeholder="e.g. Miller"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Global Tech"
          />
          <Input
            label="Job Title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. CTO"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
          <Input
            label="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+971 50 123 4567"
          />
        </div>

        {/* Lead Rating */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Lead Rating
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'hot', label: '🔥 Hot' },
              { val: 'warm', label: '☀️ Warm' },
              { val: 'cold', label: '❄️ Cold' },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setRating(r.val as any)}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  rating === r.val
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
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
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Product of Interest
          </label>
          <select
            value={productInterest}
            onChange={(e) => setProductInterest(e.target.value)}
            className="w-full h-11 text-xs rounded-lg border border-slate-300 px-3 bg-white"
          >
            <option value="Enterprise AI Platform">Enterprise AI Platform</option>
            <option value="Cloud Infrastructure & Security">Cloud Infrastructure & Security</option>
            <option value="Smart Analytics & CRM Suite">Smart Analytics & CRM Suite</option>
            <option value="Custom Software Development">Custom Software Development</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Notes / Requirement
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Met at GITEX stand, requested quote and presentation..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          className="w-full font-bold bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          <Sparkles className="w-4 h-4 mr-1 text-sky-200" />
          Save Manual Lead
        </Button>
      </form>
    </div>
  );
}
