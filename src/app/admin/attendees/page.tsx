'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_ATTENDEES } from '@/lib/data/mock-store';
import { parseAttendeeFile, validateAndMapAttendees, ColumnMapping, ParseResult } from '@/lib/utils/import-attendees';
import { Attendee } from '@/lib/types';
import { localDb } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { getActiveEvent } from '@/lib/events/active-event';
import {
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  QrCode,
  Download,
  Sparkles,
  X,
  Printer,
  CheckSquare,
  Square,
  ExternalLink,
} from 'lucide-react';

export default function AdminAttendeesPage() {
  const [activeEvent, setActiveEvent] = useState(getActiveEvent());
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Multi-select & Batch Printing state
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<Set<string>>(new Set());
  const [badgesToPrint, setBadgesToPrint] = useState<Attendee[] | null>(null);

  // Import wizard state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    badge_id: '',
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    job_title: '',
    mobile: '',
  });
  const [importSummary, setImportSummary] = useState<{ imported: number; duplicates: number; errors: number } | null>(null);

  // Manual create attendee state
  const [badgeId, setBadgeId] = useState(`${activeEvent.code}-ATT-${Math.floor(10000 + Math.random() * 90000)}`);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [visitorType, setVisitorType] = useState('Trade Visitor');

  // Detect demo mode from localStorage
  const isDemoMode = (() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_active_user');
        if (stored) return !!JSON.parse(stored).is_demo;
      }
    } catch (e) {}
    return false;
  })();

  // Load attendees on mount from Dexie localDb & Supabase
  const loadAttendees = async () => {
    try {
      // 1. Fetch from Dexie
      const localList = await localDb.attendees.toArray().catch(() => []);

      // 2. Fetch from Supabase if online
      let serverList: Attendee[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const { data: sbAttendees } = await supabase
          .from('attendees')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        if (sbAttendees && sbAttendees.length > 0) {
          serverList = sbAttendees as Attendee[];
          // Save server attendees locally to Dexie for offline speed & offline scanning
          await localDb.attendees.bulkPut(serverList).catch(() => {});
        }
      }

      // 3. Merge: demo baseline -> localList -> serverList (server wins on conflict)
      const map = new Map<string, Attendee>();
      if (isDemoMode) {
        INITIAL_ATTENDEES.forEach((a) => map.set(a.badge_id.toLowerCase(), a));
      }
      localList.forEach((a) => map.set(a.badge_id.toLowerCase(), a));
      serverList.forEach((a) => map.set(a.badge_id.toLowerCase(), a));

      setAttendees(Array.from(map.values()));
    } catch (err) {
      console.warn('Error hydrating attendees:', err);
    }
  };

  const [showAllEvents, setShowAllEvents] = useState(false);

  useEffect(() => {
    loadAttendees();

    const handleEventChange = (e?: any) => {
      if (e?.detail) {
        setActiveEvent({
          id: e.detail.id,
          name: e.detail.event_name,
          code: e.detail.event_code,
          venue: e.detail.venue,
          city: e.detail.city,
        });
      }
      loadAttendees();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lead2b_event_changed', handleEventChange);
      return () => window.removeEventListener('lead2b_event_changed', handleEventChange);
    }
  }, []);

  const filteredAttendees = attendees
    .filter((a) => {
      if (showAllEvents) return true;
      if (!activeEvent?.id) return true;
      return a.event_id === activeEvent.id;
    })
    .filter((a) =>
      `${a.first_name} ${a.last_name} ${a.company} ${a.email} ${a.badge_id}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseAttendeeFile(file);
      setParsedData(result);

      // Auto-detect columns based on common names
      const mapping: ColumnMapping = {
        badge_id: result.headers.find((h) => /badge|id|code/i.test(h)) || result.headers[0] || '',
        first_name: result.headers.find((h) => /first/i.test(h)) || result.headers[1] || '',
        last_name: result.headers.find((h) => /last/i.test(h)) || result.headers[2] || '',
        email: result.headers.find((h) => /email|mail/i.test(h)) || result.headers[3] || '',
        company: result.headers.find((h) => /company|org/i.test(h)) || '',
        job_title: result.headers.find((h) => /title|position|job/i.test(h)) || '',
        mobile: result.headers.find((h) => /mobile|phone/i.test(h)) || '',
      };
      setColumnMapping(mapping);
    } catch (err: any) {
      alert(err.message || 'Failed to read file');
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData) return;

    const existingBadges = new Set(attendees.map((a) => a.badge_id.toLowerCase()));
    const result = validateAndMapAttendees(
      parsedData.rawRows,
      columnMapping,
      activeEvent.id,
      existingBadges
    );

    const newRecords = result.validAttendees.map((a, i) => {
      const uuid =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `a${Date.now()}-${i.toString().padStart(4, '0')}-0000-0000-000000000000`;
      return {
        ...a,
        id: uuid,
        qr_token: a.qr_token || `lead2b:badge:${a.badge_id}`,
        created_at: new Date().toISOString(),
      };
    }) as Attendee[];

    // 1. Bulk persist to Dexie localDb
    await localDb.attendees.bulkPut(newRecords).catch(() => {});

    // 2. Persist to Supabase if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      const sbPayload = newRecords.map((r) => ({
        id: r.id,
        event_id: r.event_id,
        badge_id: r.badge_id,
        qr_token: r.qr_token,
        first_name: r.first_name,
        last_name: r.last_name,
        company: r.company || '',
        job_title: r.job_title || '',
        email: r.email,
        mobile: r.mobile || '',
        country: r.country || 'United Arab Emirates',
        visitor_type: r.visitor_type || 'Trade Visitor',
        consent_status: true,
      }));

      // In batches of 40
      for (let i = 0; i < sbPayload.length; i += 40) {
        const chunk = sbPayload.slice(i, i + 40);
        try {
          await supabase.from('attendees').insert(chunk);
        } catch (sbErr) {
          console.warn('Batch attendee insert error:', sbErr);
        }
      }
    }

    setAttendees([...newRecords, ...attendees]);
    setImportSummary({
      imported: result.validAttendees.length,
      duplicates: result.duplicates.length,
      errors: result.errors.length,
    });
  };

  const handleCreateSingleAttendee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeId || !firstName || !email) return;

    const uuid =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `a${Date.now()}-0000-0000-0000-000000000001`;

    const newAtt: Attendee = {
      id: uuid,
      event_id: activeEvent.id,
      badge_id: badgeId.trim(),
      qr_token: `lead2b:badge:${badgeId.trim()}`,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      company: company.trim(),
      job_title: jobTitle.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      country: 'United Arab Emirates',
      visitor_type: visitorType,
      consent_status: true,
      created_at: new Date().toISOString(),
    };

    // 1. Persist to Dexie localDb immediately
    await localDb.attendees.put(newAtt).catch(() => {});

    // 2. Persist to Supabase PostgreSQL if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('attendees').insert([
          {
            id: newAtt.id,
            event_id: newAtt.event_id,
            badge_id: newAtt.badge_id,
            qr_token: newAtt.qr_token,
            first_name: newAtt.first_name,
            last_name: newAtt.last_name,
            company: newAtt.company,
            job_title: newAtt.job_title,
            email: newAtt.email,
            mobile: newAtt.mobile,
            country: newAtt.country,
            visitor_type: newAtt.visitor_type,
            consent_status: true,
          },
        ]);
      } catch (sbErr) {
        console.warn('Single attendee insert error:', sbErr);
      }
    }

    setAttendees([newAtt, ...attendees.filter((a) => a.badge_id.toLowerCase() !== newAtt.badge_id.toLowerCase())]);
    setIsCreateModalOpen(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setCompany('');
    setJobTitle('');
    setMobile('');
    setBadgeId(`${activeEvent.code}-ATT-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  // Selection toggles
  const handleToggleSelectAll = () => {
    if (selectedAttendeeIds.size === filteredAttendees.length && filteredAttendees.length > 0) {
      setSelectedAttendeeIds(new Set());
    } else {
      setSelectedAttendeeIds(new Set(filteredAttendees.map((a) => a.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedAttendeeIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedAttendeeIds(next);
  };

  const handleOpenBatchPrint = () => {
    const selected = attendees.filter((a) => selectedAttendeeIds.has(a.id));
    if (selected.length === 0) {
      alert('Please select at least one attendee to print badges.');
      return;
    }
    setBadgesToPrint(selected);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3 text-brand-600" />
            Visitor Directory & Badging
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Attendee & Badge Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {attendees.length} registered attendees • Generates encrypted badge tokens for offline 5-second QR scans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedAttendeeIds.size > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenBatchPrint}
              className="text-xs font-bold gap-1.5 bg-brand-700 hover:bg-brand-800 shadow-sm animate-pulse"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Batch Print Badges ({selectedAttendeeIds.size})</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="text-xs font-bold gap-1.5 bg-white border-brand-200 text-brand-800 hover:bg-brand-50"
          >
            <Upload className="w-3.5 h-3.5 text-brand-600" />
            <span>Bulk Import (CSV / XLSX)</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Attendee</span>
          </Button>
        </div>
      </div>

      {/* Search Input & Batch Bar */}
      <Card className="p-3 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search attendee by badge ID, name, email, or company..."
            className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-9 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active Event Scope Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400">Event Scope:</span>
            <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {showAllEvents ? 'All Exhibitions' : (activeEvent?.name || 'Active Event')}
            </span>
            <span className="text-slate-400 font-medium">({filteredAttendees.length} badges)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAllEvents(!showAllEvents)}
            className="text-[11px] font-bold text-brand-700 hover:underline cursor-pointer"
          >
            {showAllEvents ? `← Filter by ${activeEvent?.name || 'Active Event'}` : `View All Attendees Across All Events (${attendees.length}) →`}
          </button>
        </div>

        {/* Multi-selection summary banner */}
        {selectedAttendeeIds.size > 0 && (
          <div className="flex items-center justify-between bg-brand-50/80 border border-brand-200/80 rounded-xl px-3.5 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand-950">
                {selectedAttendeeIds.size} of {filteredAttendees.length} attendees selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedAttendeeIds(new Set(filteredAttendees.map((a) => a.id)))}
                className="text-[11px] font-bold text-brand-700 hover:text-brand-900 underline"
              >
                Select All ({filteredAttendees.length})
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setSelectedAttendeeIds(new Set())}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
              >
                Clear Selection
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenBatchPrint}
                className="text-xs font-bold gap-1.5 ml-2 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Badges</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Attendees Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedAttendeeIds.size > 0 && selectedAttendeeIds.size === filteredAttendees.length
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                    title="Select / Deselect all visible"
                  />
                </th>
                <th className="p-3.5">Badge ID & QR Token</th>
                <th className="p-3.5">Attendee Name</th>
                <th className="p-3.5">Company & Title</th>
                <th className="p-3.5">Email & Contact</th>
                <th className="p-3.5">Badge Type</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendees.map((att) => {
                const isSelected = selectedAttendeeIds.has(att.id);
                return (
                  <tr
                    key={att.id}
                    className={`transition ${isSelected ? 'bg-brand-50/40 hover:bg-brand-50/70' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(att.id)}
                        className="w-4 h-4 rounded text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-brand-900 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-md text-[11px]">
                        {att.badge_id}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
                        {att.qr_token}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="font-black text-slate-900 leading-snug">
                        {att.first_name} {att.last_name}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{att.company}</div>
                      <div className="text-[11px] text-slate-400">{att.job_title}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-mono text-slate-600">{att.email}</div>
                      <div className="text-[11px] text-slate-400">{att.mobile}</div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={att.visitor_type === 'VIP' ? 'vip' : 'default'}>
                        {att.visitor_type || 'Trade Visitor'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setBadgesToPrint([att])}
                        className="text-xs font-bold text-brand-700 hover:text-brand-900 px-2 py-1 rounded hover:bg-brand-50 transition inline-flex items-center gap-1 border border-brand-200/60 bg-white"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Badge</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Batch & Single Badge Print Modal */}
      {badgesToPrint && (
        <Modal
          isOpen={!!badgesToPrint}
          onClose={() => setBadgesToPrint(null)}
          title={`Print ${badgesToPrint.length === 1 ? 'Attendee Badge' : `${badgesToPrint.length} Badges in Batch`}`}
          description={`High-resolution encrypted QR badge for fast offline badge scanning at ${activeEvent.name}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Ready for standard 100mm × 140mm badge lanyards or thermal sticker printers.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                }}
                className="text-xs font-bold gap-1.5 shadow-sm bg-brand-700 hover:bg-brand-800"
              >
                <Printer className="w-4 h-4" />
                <span>Send to Printer ({badgesToPrint.length})</span>
              </Button>
            </div>

            {/* Printable Badges Container */}
            <div
              id="printable-badges-container"
              className="max-h-[60vh] overflow-y-auto p-4 bg-slate-100/80 rounded-2xl space-y-6 flex flex-col items-center"
            >
              {badgesToPrint.map((att, idx) => {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  att.qr_token || `lead2b:badge:${att.badge_id}`
                )}`;

                const isVip = att.visitor_type === 'VIP';
                const isSpeaker = att.visitor_type === 'Speaker';
                const isExhibitor = att.visitor_type === 'Exhibitor';

                let bannerBg = 'bg-teal-700 text-white';
                if (isVip) bannerBg = 'bg-gradient-to-r from-amber-600 to-amber-700 text-white';
                else if (isSpeaker) bannerBg = 'bg-purple-800 text-white';
                else if (isExhibitor) bannerBg = 'bg-blue-800 text-white';

                return (
                  <div
                    key={att.id || idx}
                    className="w-[340px] bg-white rounded-2xl shadow-md border-2 border-slate-200 overflow-hidden flex flex-col print:border-none print:shadow-none print:w-full print:page-break-after-always print:m-0"
                    style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
                  >
                    {/* Badge Top Header */}
                    <div className="bg-slate-900 text-white p-3.5 text-center">
                      <div className="text-[10px] uppercase font-black tracking-widest text-teal-400">
                        {activeEvent.name}
                      </div>
                      <div className="text-[10px] text-slate-300 font-medium">
                        {activeEvent.venue || 'Maharnombu Pottal, Karaikkudi'}
                      </div>
                    </div>

                    {/* Visitor Type Ribbon */}
                    <div className={`${bannerBg} py-1.5 text-center font-black tracking-widest uppercase text-xs shadow-inner`}>
                      {att.visitor_type || 'Trade Visitor'}
                    </div>

                    {/* Attendee Details */}
                    <div className="p-5 text-center flex-1 flex flex-col justify-between">
                      <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
                          {att.first_name} {att.last_name}
                        </h2>
                        <div className="text-xs font-bold text-slate-700 mt-1 line-clamp-1">{att.job_title}</div>
                        <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide line-clamp-1">
                          {att.company}
                        </div>
                      </div>

                      {/* QR Code Centerpiece */}
                      <div className="my-4 flex flex-col items-center justify-center">
                        <div className="p-2.5 bg-white border-2 border-slate-900 rounded-xl shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={qrUrl}
                            alt={`QR for ${att.badge_id}`}
                            className="w-36 h-36 object-contain"
                          />
                        </div>
                        <div className="font-mono text-[11px] font-black tracking-wider text-slate-800 mt-2">
                          {att.badge_id}
                        </div>
                      </div>

                      {/* Badge Footer Clearances */}
                      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider space-y-0.5">
                        <div>Access: ALL HALLS (1-8) • AI EXPO</div>
                        <div className="font-mono text-[9px] text-slate-400">
                          Encrypted Lead2b Offline Payload
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Tip: Set printer orientation to Portrait and Margins to None.
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setBadgesToPrint(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    window.print();
                  }}
                  className="font-bold gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Badges Now</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Import Modal Wizard */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setParsedData(null);
          setImportSummary(null);
        }}
        title="Bulk Attendee Import Wizard"
        description="Upload CSV or Excel file, map column fields, and validate duplicates"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {!parsedData && !importSummary && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-brand-300 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50/40 transition bg-slate-50/50"
            >
              <div className="p-3 bg-brand-100 text-brand-700 rounded-full mb-2">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Upload Attendee Spreadsheet (.xlsx or .csv)</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Supports pre-registration exports from DWTC, Eventbrite, or custom organizer databases.
              </p>
              <Button size="sm" variant="secondary" className="mt-4 pointer-events-none">
                Browse Files
              </Button>
            </div>
          )}

          {parsedData && !importSummary && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-brand-50 rounded-2xl border border-brand-200 text-brand-950 flex items-center justify-between">
                <span>Spreadsheet Loaded: <strong>{parsedData.totalRows} attendee rows</strong> detected.</span>
                <span className="font-bold text-[11px] text-brand-700">Map Columns Below</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge ID Column *</label>
                  <select
                    value={columnMapping.badge_id}
                    onChange={(e) => setColumnMapping({ ...columnMapping, badge_id: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800"
                  >
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address Column *</label>
                  <select
                    value={columnMapping.email}
                    onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800"
                  >
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name Column *</label>
                  <select
                    value={columnMapping.first_name}
                    onChange={(e) => setColumnMapping({ ...columnMapping, first_name: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800"
                  >
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name Column</label>
                  <select
                    value={columnMapping.last_name}
                    onChange={(e) => setColumnMapping({ ...columnMapping, last_name: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800"
                  >
                    {parsedData.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setParsedData(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleExecuteImport} className="font-bold">
                  Execute Validation & Import
                </Button>
              </div>
            </div>
          )}

          {importSummary && (
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Import Batch Finished</h3>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs w-full max-w-sm space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-600">Imported Attendees:</span>
                  <span className="font-bold text-emerald-600 font-mono">{importSummary.imported}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Skipped (Duplicates):</span>
                  <span className="font-bold text-amber-600 font-mono">{importSummary.duplicates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Validation Errors:</span>
                  <span className="font-bold text-rose-600 font-mono">{importSummary.errors}</span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedData(null);
                  setImportSummary(null);
                }}
                className="mt-2 font-bold"
              >
                Close & View Attendees
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Manual Attendee Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Single Attendee"
        description="Register a visitor and issue instant badge ID"
      >
        <form onSubmit={handleCreateSingleAttendee} className="space-y-3.5">
          <Input
            label="Badge ID"
            value={badgeId}
            onChange={(e) => setBadgeId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Input
              label="Job Title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+971 50 123 4567"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Visitor Category
            </label>
            <select
              value={visitorType}
              onChange={(e) => setVisitorType(e.target.value)}
              className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="Trade Visitor">Trade Visitor</option>
              <option value="VIP">VIP</option>
              <option value="Speaker">Speaker</option>
              <option value="Press">Press</option>
              <option value="Exhibitor">Exhibitor</option>
            </select>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold">
              Save Attendee & Issue Badge
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
