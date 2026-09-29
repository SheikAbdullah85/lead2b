'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_ATTENDEES } from '@/lib/data/mock-store';
import { parseAttendeeFile, validateAndMapAttendees, ColumnMapping, ParseResult } from '@/lib/utils/import-attendees';
import { Attendee } from '@/lib/types';
import { Users, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Search, Plus, QrCode, Download, Sparkles, X, Printer } from 'lucide-react';

export default function AdminAttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>(INITIAL_ATTENDEES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
  const [badgeId, setBadgeId] = useState(`GITEX2026-ATT-${Math.floor(10000 + Math.random() * 90000)}`);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [visitorType, setVisitorType] = useState('Trade Visitor');

  const filteredAttendees = attendees.filter((a) =>
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

  const handleExecuteImport = () => {
    if (!parsedData) return;

    const existingBadges = new Set(attendees.map((a) => a.badge_id.toLowerCase()));
    const result = validateAndMapAttendees(
      parsedData.rawRows,
      columnMapping,
      'eeee1111-1111-1111-1111-111111111111',
      existingBadges
    );

    const newRecords = result.validAttendees.map((a, i) => ({
      ...a,
      id: `att_imp_${Date.now()}_${i}`,
    })) as Attendee[];

    setAttendees([...newRecords, ...attendees]);
    setImportSummary({
      imported: result.validAttendees.length,
      duplicates: result.duplicates.length,
      errors: result.errors.length,
    });
  };

  const handleCreateSingleAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeId || !firstName || !email) return;

    const newAtt: Attendee = {
      id: `att_${Date.now()}`,
      event_id: 'eeee1111-1111-1111-1111-111111111111',
      badge_id: badgeId,
      qr_token: `lead2b:badge:${badgeId}`,
      first_name: firstName,
      last_name: lastName,
      company,
      job_title: jobTitle,
      email,
      visitor_type: visitorType,
      consent_status: true,
      created_at: new Date().toISOString(),
    };

    setAttendees([newAtt, ...attendees]);
    setIsCreateModalOpen(false);
    setFirstName('');
    setLastName('');
    setEmail('');
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

      {/* Search Input */}
      <Card className="p-3 shadow-2xs">
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
      </Card>

      {/* Attendees Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Badge ID & QR Token</th>
                <th className="p-3.5">Attendee Name</th>
                <th className="p-3.5">Company & Title</th>
                <th className="p-3.5">Email & Contact</th>
                <th className="p-3.5">Badge Type</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendees.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-brand-900 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-md text-[11px]">
                      {att.badge_id}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">
                      {att.qr_token}
                    </div>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    <div className="font-black text-slate-900 leading-snug">{att.first_name} {att.last_name}</div>
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
                    <button className="text-xs font-bold text-brand-700 hover:text-brand-900 px-2 py-1 rounded hover:bg-brand-50 transition inline-flex items-center gap-1">
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

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
