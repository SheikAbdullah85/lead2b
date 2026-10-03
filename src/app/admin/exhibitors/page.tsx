'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Organization, Event, License } from '@/lib/types';
import { INITIAL_EVENTS } from '@/lib/data/mock-store';
import { Building2, Plus, ShieldCheck, Mail, Phone, Globe, Trash2, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const INITIAL_EXHIBITORS: Organization[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    company_name: 'Alpha Technology Group',
    company_code: 'ALPHA-TECH',
    primary_contact_name: 'David Miller',
    email: 'admin@alphatech.com',
    phone: '+971 4 399 1000',
    country: 'United Arab Emirates',
    website: 'https://alphatech.example.com',
    active_status: true,
    subscription_plan: 'event_pro',
    license_count: 10,
    assigned_event_name: 'GITEX Global 2026',
    assigned_stand: 'Stand H3-B24',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    company_name: 'Beta Solutions Corp',
    company_code: 'BETA-SOL',
    primary_contact_name: 'Elena Rostova',
    email: 'contact@betasolutions.example.com',
    phone: '+44 20 7946 0991',
    country: 'United Kingdom',
    website: 'https://betasolutions.example.com',
    active_status: true,
    subscription_plan: 'event_standard',
    license_count: 5,
    assigned_event_name: 'GITEX Global 2026',
    assigned_stand: 'Stand H6-A12',
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
];

export default function AdminExhibitorsPage() {
  const [exhibitors, setExhibitors] = useState<Organization[]>([]);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('United Arab Emirates');
  const [website, setWebsite] = useState('');
  const [plan, setPlan] = useState('event_standard');
  const [licenses, setLicenses] = useState(5);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [assignedStand, setAssignedStand] = useState('Stand H3-B24');

  const loadExhibitors = async () => {
    setIsLoading(true);
    try {
      // 1. Load Events from Supabase & localStorage
      let localEvents: Event[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_events');
        if (stored) {
          try {
            localEvents = JSON.parse(stored);
          } catch (e) {}
        }
      }

      let serverEvents: Event[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const { data: dbEvts } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });
          if (dbEvts && dbEvts.length > 0) {
            serverEvents = dbEvts as Event[];
          }
        } catch (e) {}
      }

      const seenEvtIds = new Set<string>();
      const mergedEvents: Event[] = [];
      for (const ev of [...serverEvents, ...localEvents, ...INITIAL_EVENTS]) {
        if (!seenEvtIds.has(ev.id)) {
          seenEvtIds.add(ev.id);
          mergedEvents.push(ev);
        }
      }
      setEventsList(mergedEvents);

      if (mergedEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(mergedEvents[0].id);
      }

      // 2. Load Exhibitors from localStorage
      let localList: Organization[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_exhibitors');
        if (stored) {
          try {
            localList = JSON.parse(stored);
          } catch (e) {}
        }
      }

      // 3. Load from Supabase PostgreSQL if online
      let serverList: Organization[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const { data: dbOrgs } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbOrgs && dbOrgs.length > 0) {
          serverList = dbOrgs as Organization[];
        }
      }

      // 4. Deduplicate by ID and Company Code
      const seenIds = new Set<string>();
      const seenCodes = new Set<string>();
      const merged: Organization[] = [];

      for (const org of [...serverList, ...localList, ...INITIAL_EXHIBITORS]) {
        const codeKey = org.company_code?.trim().toUpperCase();
        if (!seenIds.has(org.id) && (!codeKey || !seenCodes.has(codeKey))) {
          seenIds.add(org.id);
          if (codeKey) seenCodes.add(codeKey);

          // If assigned_event_name is missing, try to resolve from assigned_event_id or fallback
          let resolvedEventName = org.assigned_event_name;
          if (!resolvedEventName && org.assigned_event_id) {
            const evMatch = mergedEvents.find((e) => e.id === org.assigned_event_id);
            if (evMatch) resolvedEventName = evMatch.event_name;
          }
          if (!resolvedEventName) {
            resolvedEventName = mergedEvents[0]?.event_name || 'GITEX Global 2026';
          }

          merged.push({
            ...org,
            assigned_event_name: resolvedEventName,
            assigned_stand: org.assigned_stand || 'Stand H3-B24',
          });
        }
      }

      setExhibitors(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lead2b_exhibitors', JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('Error hydrating exhibitors:', err);
      setExhibitors(INITIAL_EXHIBITORS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExhibitors();

    const handleEventChange = () => {
      loadExhibitors();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lead2b_event_changed', handleEventChange);
      return () => {
        window.removeEventListener('lead2b_event_changed', handleEventChange);
      };
    }
  }, []);

  const handleAddExhibitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !email.trim()) return;

    setIsSaving(true);
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '33333333-3333-3333-3333-333333333333';

    const selectedEv = eventsList.find((ev) => ev.id === selectedEventId) || eventsList[0];
    const eventId = selectedEv?.id || 'eeee1111-1111-1111-1111-111111111111';
    const eventNameStr = selectedEv?.event_name || 'GITEX Global 2026';
    const standStr = assignedStand.trim() || 'Stand H3-B24';

    const newExhibitor: Organization = {
      id: newId,
      company_name: name.trim(),
      company_code: code.trim().toUpperCase(),
      primary_contact_name: contactName.trim() || undefined,
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      country: country.trim() || 'United Arab Emirates',
      website: website.trim() || undefined,
      active_status: true,
      subscription_plan: plan,
      license_count: Number(licenses) || 5,
      assigned_event_id: eventId,
      assigned_event_name: eventNameStr,
      assigned_stand: standStr,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Auto-provision a license package for this new exhibitor tenant
    const newLicId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '44444444-4444-4444-4444-444444444444';

    const newLicense: License = {
      id: newLicId,
      tenant_id: newExhibitor.id,
      tenant_name: newExhibitor.company_name,
      plan: newExhibitor.subscription_plan,
      allowed_events: 1,
      allowed_users: newExhibitor.license_count,
      lead_limit: 5000,
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // 1. Optimistic UI & Local Storage
    const updated = [newExhibitor, ...exhibitors];
    setExhibitors(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_exhibitors', JSON.stringify(updated));

        // Save license to localStorage as well
        let currentLics: License[] = [];
        const storedLics = localStorage.getItem('lead2b_admin_licenses');
        if (storedLics) {
          try {
            currentLics = JSON.parse(storedLics);
          } catch (e) {}
        }
        const updatedLics = [newLicense, ...currentLics.filter((l) => l.tenant_id !== newExhibitor.id)];
        localStorage.setItem('lead2b_admin_licenses', JSON.stringify(updatedLics));
      } catch (err) {}
    }

    // 2. Persist to Supabase PostgreSQL
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const { error: orgErr } = await supabase.from('organizations').insert([
          {
            id: newExhibitor.id,
            company_name: newExhibitor.company_name,
            company_code: newExhibitor.company_code,
            primary_contact_name: newExhibitor.primary_contact_name,
            email: newExhibitor.email,
            phone: newExhibitor.phone,
            country: newExhibitor.country,
            website: newExhibitor.website,
            active_status: true,
            subscription_plan: newExhibitor.subscription_plan,
            license_count: newExhibitor.license_count,
            assigned_event_id: newExhibitor.assigned_event_id,
            assigned_event_name: newExhibitor.assigned_event_name,
            assigned_stand: newExhibitor.assigned_stand,
          },
        ]);
        if (orgErr) {
          console.warn('Supabase organization insert notice:', orgErr.message);
        }

        // Insert license in Supabase
        const { error: licErr } = await supabase.from('licenses').insert([
          {
            id: newLicense.id,
            tenant_id: newLicense.tenant_id,
            plan: newLicense.plan,
            allowed_events: newLicense.allowed_events,
            allowed_users: newLicense.allowed_users,
            lead_limit: newLicense.lead_limit,
            start_date: newLicense.start_date,
            expiry_date: newLicense.expiry_date,
            is_active: true,
          },
        ]);
        if (licErr) {
          console.warn('Supabase license insert notice:', licErr.message);
        }
      } catch (sbErr) {
        console.warn('Supabase insert network error:', sbErr);
      }
    }

    setIsSaving(false);
    setIsAddModalOpen(false);
    setName('');
    setCode('');
    setContactName('');
    setEmail('');
    setPhone('');
    setWebsite('');
  };

  const toggleStatus = async (id: string) => {
    const target = exhibitors.find((ex) => ex.id === id);
    if (!target) return;

    const newStatus = !target.active_status;
    const updated = exhibitors.map((ex) => (ex.id === id ? { ...ex, active_status: newStatus } : ex));
    setExhibitors(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_exhibitors', JSON.stringify(updated));
      } catch (e) {}
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('organizations').update({ active_status: newStatus }).eq('id', id);
      } catch (err) {
        console.warn('Failed to update status in Supabase:', err);
      }
    }
  };

  const handleDeleteExhibitor = async (id: string, exName: string) => {
    if (!confirm(`Are you sure you want to delete exhibitor "${exName}"? This will remove all associated tenant settings.`)) {
      return;
    }

    const remaining = exhibitors.filter((ex) => ex.id !== id);
    setExhibitors(remaining);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_exhibitors', JSON.stringify(remaining));
      } catch (e) {}
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('organizations').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete organization from Supabase:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Building2 className="w-3 h-3 text-brand-600" />
            Exhibitor Tenant Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Exhibitor Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision exhibitor tenants, allocate stand licenses, and enforce PostgreSQL multi-tenant isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadExhibitors}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Refresh exhibitors list from server"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Exhibitor Tenant</span>
          </Button>
        </div>
      </div>

      {/* Exhibitors Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Company & Code</th>
                <th className="p-3.5">Primary Contact</th>
                <th className="p-3.5">Assigned Stand</th>
                <th className="p-3.5">Plan & Quota</th>
                <th className="p-3.5">Tenant Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exhibitors.map((ex) => (
                <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                        {ex.company_name ? ex.company_name.slice(0, 2).toUpperCase() : 'EX'}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 leading-snug">{ex.company_name}</div>
                        <div className="text-[11px] font-mono text-slate-400 font-normal">{ex.company_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800">{ex.primary_contact_name || 'Stand Manager'}</div>
                    <div className="text-[11px] text-slate-400">{ex.email}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-800">{ex.assigned_event_name || 'Active Event'}</span>
                    <div className="text-[11px] font-mono text-brand-700 font-bold">{ex.assigned_stand || 'Stand Unassigned'}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-black text-brand-700">{ex.license_count || 5} User Licenses</span>
                    <div className="text-[11px] text-slate-400 font-mono uppercase">{ex.subscription_plan || 'Standard'}</div>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={ex.active_status ? 'synced' : 'default'}>
                      {ex.active_status ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => toggleStatus(ex.id)}
                        className={`text-xs font-bold px-2.5 py-1 rounded transition ${
                          ex.active_status
                            ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                            : 'text-brand-700 hover:text-brand-900 hover:bg-brand-50'
                        }`}
                      >
                        {ex.active_status ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteExhibitor(ex.id, ex.company_name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Exhibitor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {exhibitors.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No exhibitors found. Click &quot;Add Exhibitor Tenant&quot; to provision a new exhibitor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Exhibitor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Exhibitor Tenant"
        description="Creates tenant partition, stand assignment, branding container, and root admin license"
      >
        <form onSubmit={handleAddExhibitor} className="space-y-3.5">
          <Input
            label="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Siemens Global"
            required
          />

          <Input
            label="Company Code (Tenant Identifier)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SIEMENS-01"
            required
          />

          {/* Event and Stand Allocation */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Participating Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                required
              >
                {eventsList.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.event_name} ({evt.event_code})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Assigned Stand / Booth"
              value={assignedStand}
              onChange={(e) => setAssignedStand(e.target.value)}
              placeholder="e.g. Stand H3-B24 or Stand TK-01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Primary Contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Elena Rostova"
            />
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 4 000 0000"
            />
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="United Arab Emirates"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subscription Tier
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="event_standard">Event Standard (5 Users)</option>
                <option value="event_pro">Event Pro (10 Users)</option>
                <option value="annual_enterprise">Annual Enterprise (Unlimited)</option>
              </select>
            </div>

            <Input
              label="Rep License Count"
              type="number"
              value={licenses}
              onChange={(e) => setLicenses(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Exhibitor Tenant'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
