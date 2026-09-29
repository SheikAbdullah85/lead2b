'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { compressBusinessCardImage } from '@/lib/utils/compress-image';
import { parseBusinessCardText, ParsedBusinessCard } from '@/lib/ocr/card-parser';
import { Camera, RefreshCw, Sparkles, Check, AlertCircle, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import { saveLeadLocally } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';
import { Lead } from '@/lib/types';

interface BusinessCardScannerProps {
  onSuccess: (savedLead: Lead) => void;
  onCancel: () => void;
}

export function BusinessCardScanner({ onSuccess, onCancel }: BusinessCardScannerProps) {
  const { user } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ origKB: number; compKB: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [rawOcrText, setRawOcrText] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);
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

  const processImageOcr = async (imageUrl: string) => {
    setIsScanning(true);
    setScanStatus('Initializing OCR engine...');
    setScanSuccess(false);

    try {
      setScanStatus('Scanning card text with on-device OCR...');
      
      // Dynamic import ensures client-side execution only
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            setScanStatus(`Reading card text: ${pct}%`);
          }
        },
      });

      const ret = await worker.recognize(imageUrl);
      await worker.terminate();

      const extractedText = ret?.data?.text || '';
      setRawOcrText(extractedText);

      if (extractedText.trim().length > 0) {
        setScanStatus('Parsing business card details...');
        const parsed: ParsedBusinessCard = parseBusinessCardText(extractedText);

        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.designation) setDesignation(parsed.designation);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.website) setWebsite(parsed.website);
        if (parsed.address) {
          setNotes((prev) => (prev ? `${prev}\nAddress: ${parsed.address}` : `Address: ${parsed.address}`));
        }

        setScanSuccess(true);
        setScanStatus('Card read successfully! Review details below.');
      } else {
        setScanStatus('Could not clearly read text. You can fill details manually or retake.');
      }
    } catch (err: any) {
      console.error('OCR scanning error:', err);
      setScanStatus('OCR process encountered an error. Please enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

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

      // Run live on-device OCR on the captured image
      await processImageOcr(result.dataUrl);
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
        full_name: `${firstName} ${lastName}`.trim(),
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
        {/* Hidden inputs for camera capture vs gallery picker */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="w-full relative rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Business Card Preview" className="w-full h-48 object-contain" />

            {/* Scanning overlay animation when active */}
            {isScanning && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
                <p className="text-xs font-bold text-cyan-200">{scanStatus || 'Reading card text...'}</p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-linear-to-r from-teal-400 to-cyan-400 animate-pulse w-full rounded-full" />
                </div>
              </div>
            )}

            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isScanning}
                onClick={() => cameraInputRef.current?.click()}
                className="text-[11px] shadow-sm bg-white/90 backdrop-blur-sm"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retake
              </Button>
            </div>

            {compressionStats && !isScanning && (
              <div className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-sm text-[#22d3ee] text-[10px] font-mono px-2.5 py-1 rounded-full border border-[#00838f]/40">
                Compressed: {compressionStats.compKB} KB (was {compressionStats.origKB} KB)
              </div>
            )}
          </div>
        ) : (
          <div className="w-full space-y-2">
            <div className="w-full border-2 border-dashed border-[#00838f]/30 rounded-2xl flex flex-col items-center justify-center p-4 bg-slate-50/50 text-center">
              <div className="p-3 bg-teal-50 text-[#00838f] rounded-full mb-2 shadow-xs border border-teal-100">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">Business Card AI Reader</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Snaps visitor card to auto-read Name, Company, Email & Phone directly on your device.
              </p>
              <div className="mt-3 flex gap-2 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#00838f] hover:bg-[#006d77] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-cyan-200" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>Gallery</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OCR Status banner */}
      {scanStatus && !isScanning && (
        <div
          className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${
            scanSuccess
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {scanSuccess ? (
            <Sparkles className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <span className="font-semibold">{scanStatus}</span>
            {rawOcrText && (
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="ml-2 underline text-[11px] font-bold text-brand-700 hover:text-brand-900"
              >
                {showRawText ? 'Hide raw OCR' : 'View raw OCR'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Raw OCR Text toggle */}
      {showRawText && rawOcrText && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {rawOcrText}
        </div>
      )}

      {/* Manual & Extracted Fields */}
      <div className="grid grid-cols-2 gap-2.5">
        <Input
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="e.g. Ahamed"
        />
        <Input
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          placeholder="e.g. Jameel"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Input
          label="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Aristo Star"
        />
        <Input
          label="Designation / Title"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="e.g. Business Development Manager"
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
          Booth Notes / Address / Context
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
          isLoading={isSaving || isCompressing || isScanning}
          className="flex-[2] py-3 text-sm font-bold shadow-md"
        >
          <Sparkles className="w-4 h-4 mr-1 text-cyan-200" />
          Save Business Card Lead
        </Button>
      </div>
    </form>
  );
}
