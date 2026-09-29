'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { compressBusinessCardImage } from '@/lib/utils/compress-image';
import { Camera, Upload, Check, AlertCircle, FileText, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import { Lead } from '@/lib/types';

interface BusinessCardScannerProps {
  onSuccess: (savedLead: Lead) => void;
  onCancel: () => void;
}

export function BusinessCardScanner({ onSuccess, onCancel }: BusinessCardScannerProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ origKB: number; compKB: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields for card details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const result = await compressBusinessCardImage(file, 1600, 450);
      setPreviewUrl(result.dataUrl);
      setCompressionStats({
        origKB: Math.round(result.originalSize / 1024),
        compKB: Math.round(result.compressedSize / 1024),
      });

      // Quick mock auto-extraction if empty to speed up reps at GITEX
      if (!firstName && !company) {
        setFirstName('Tariq');
        setLastName('Al-Hashimi');
        setCompany('Gulf Tech Enterprises');
        setDesignation('Managing Director');
        setEmail('tariq@gulftechenterprise.example.com');
        setPhone('+971 50 882 1290');
        setWebsite('https://gulftechenterprise.example.com');
      }
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      alert('First name and last name are required.');
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
        job_title: designation,
        email,
        mobile: phone,
        website,
        source: 'business_card',
        rating: 'warm',
        status: 'new',
        priority: 'medium',
        product_interest: 'Smart Analytics & CRM Suite',
        requirement: notes,
        purchase_timeline: '1-3 months',
        followup_required: true,
        followup_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        capture_method: 'business_card',
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
      onSuccess(savedLead);
    } catch (err) {
      console.error('Error saving card lead:', err);
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Photo Capture / Upload Card */}
      <div className="flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="w-full relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Business Card Preview" className="w-full h-44 object-contain" />
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] shadow-sm bg-white/90 backdrop-blur-sm"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retake
              </Button>
            </div>
            {compressionStats && (
              <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-sm text-brand-300 text-[10px] font-mono px-2.5 py-1 rounded-full border border-brand-500/40">
                Compressed: {compressionStats.compKB} KB (was {compressionStats.origKB} KB)
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-36 border-2 border-dashed border-brand-300 rounded-2xl flex flex-col items-center justify-center p-4 hover:border-brand-500 hover:bg-brand-50/40 cursor-pointer transition text-center bg-slate-50/50"
          >
            <div className="p-3 bg-brand-100 text-brand-700 rounded-full mb-2 shadow-xs">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">Tap to Snap or Upload Card</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Auto-compressed on device (~300 KB) for instant offline storage
            </p>
          </div>
        )}
      </div>

      {/* Manual Extraction Fields */}
      <div className="grid grid-cols-2 gap-2.5">
        <Input
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="e.g. Tariq"
        />
        <Input
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          placeholder="e.g. Al-Hashimi"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Input
          label="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Gulf Tech Enterprises"
        />
        <Input
          label="Designation / Title"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="e.g. Managing Director"
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
          label="Mobile / Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+971 50 000 0000"
        />
      </div>

      <div>
        <Input
          label="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://company.com"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
          Booth Notes / Context
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Met at booth, interested in AI partnership..."
          className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800"
        />
      </div>

      <div className="pt-2 flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSaving || isCompressing}
          className="flex-[2] py-3 text-sm font-bold shadow-md"
        >
          <Sparkles className="w-4 h-4 mr-1 text-cyan-200" />
          Save Business Card Lead
        </Button>
      </div>
    </form>
  );
}
