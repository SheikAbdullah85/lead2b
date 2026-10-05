'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Organization, Event, License } from '@/lib/types';
import { INITIAL_EVENTS, INITIAL_EXHIBITORS } from '@/lib/data/mock-store';
import { useAuth } from '@/lib/auth/context';
import { Building2, Plus, ShieldCheck, Mail, Phone, Globe, Trash2, CheckCircle2, Sparkles, RefreshCw, Key, Lock, Eye, EyeOff, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { getActiveEvent } from '@/lib/events/active-event';

export default function AdminExhibitorsPage() {
  const { user, isDemoMode } = useAuth();
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
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [plan, setPlan] = useState('event_standard');
  const [licenses, setLicenses] = useState(5);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [assignedStand, setAssignedStand] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

      let deletedEvtIds = new Set<string>();
      let deletedOrgIds = new Set<string>();
      if (typeof window !== 'undefined') {
        try {
          const rawEvt = localStorage.getItem('lead2b_deleted_event_ids');
          if (rawEvt) deletedEvtIds = new Set(JSON.parse(rawEvt));
          const rawOrg = localStorage.getItem('lead2b_deleted_exhibitor_ids');
          if (rawOrg) deletedOrgIds = new Set(JSON.parse(rawOrg));
        } catch (e) {}
      }

      const seenEvtIds = new Set<string>();
      const mergedEvents: Event[] = [];
      const baseEvents = isDemoMode
        ? (localEvents.length > 0 || serverEvents.length > 0 ? [...serverEvents, ...localEvents] : [...serverEvents, ...localEvents, ...INITIAL_EVENTS])
        : [...serverEvents, ...localEvents];

      for (const ev of baseEvents) {
        if (!seenEvtIds.has(ev.id) && !deletedEvtIds.has(ev.id)) {
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
      const baseOrgs = isDemoMode
        ? (localList.length > 0 || serverList.length > 0 ? [...serverList, ...localList] : [...serverList, ...localList, ...INITIAL_EXHIBITORS])
        : [...serverList, ...localList];

      for (const org of baseOrgs) {
        const codeKey = org.company_code?.trim().toUpperCase();
        if (!seenIds.has(org.id) && !deletedOrgIds.has(org.id) && (!codeKey || !seenCodes.has(codeKey))) {
          seenIds.add(org.id);
          if (codeKey) seenCodes.add(codeKey);

          // If assigned_event_name is missing, try to resolve from assigned_event_id or fallback
          let resolvedEventName = org.assigned_event_name;
          if (!resolvedEventName && org.assigned_event_id) {
            const evMatch = mergedEvents.find((e) => e.id === org.assigned_event_id);
            if (evMatch) resolvedEventName = evMatch.event_name;
          }
          if (!resolvedEventName) {
            resolvedEventName = mergedEvents[0]?.event_name || (isDemoMode ? getActiveEvent().name : 'No Event Assigned');
          }

          merged.push({
            ...org,
            assigned_event_name: resolvedEventName,
            assigned_stand: org.assigned_stand || 'Stand Unassigned',
          });
        }
      }

      setExhibitors(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lead2b_exhibitors', JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('Error hydrating exhibitors:', err);
      setExhibitors(isDemoMode ? INITIAL_EXHIBITORS : []);
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
      return () => window.removeEventListener('lead2b_event_changed', handleEventChange);
    }
  }, [isDemoMode]);

  const handleAddExhibitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !email.trim()) return;

    setIsSaving(true);
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '33333333-3333-3333-3333-333333333333';

    const activeEv = getActiveEvent();
    const selectedEv = eventsList.find((ev) => ev.id === selectedEventId) || eventsList[0];
    const eventId = selectedEv?.id || activeEv.id;
    const eventNameStr = selectedEv?.event_name || activeEv.name;
    const standStr = assignedStand.trim() || 'Stand TBD';

    const newExhibitor: Organization = {
      id: newId,
      company_name: name.trim(),
      company_code: code.trim().toUpperCase(),
      primary_contact_name: contactName.trim() || undefined,
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      country: country.trim() || '',
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

        // Provision Exhibitor Portal Login Credentials with assigned password
        const cleanAdminEmail = newExhibitor.email.toLowerCase();
        const customStored = localStorage.getItem('lead2b_registered_users');
        const registered = customStored ? JSON.parse(customStored) : {};
        registered[cleanAdminEmail] = {
          id: `u_${Date.now()}`,
          email: cleanAdminEmail,
          full_name: newExhibitor.primary_contact_name || newExhibitor.company_name,
          system_role: 'exhibitor_admin',
          tenant_id: newExhibitor.id,
          booth_number: newExhibitor.assigned_stand?.replace('Stand ', ''),
          is_active: true,
          created_at: new Date().toISOString(),
          password: portalPassword.trim() || 'Password123!',
        };
        localStorage.setItem('lead2b_registered_users', JSON.stringify(registered));
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
    setCountry('');
    setAssignedStand('');
    setPortalPassword('');
  };

  // Edit Exhibitor State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExhibitor, setEditingExhibitor] = useState<Organization | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editPlan, setEditPlan] = useState('event_standard');
  const [editLicenses, setEditLicenses] = useState(5);
  const [editEventId, setEditEventId] = useState('');
  const [editStand, setEditStand] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenEditExhibitor = (org: Organization) => {
    setEditingExhibitor(org);
    setEditName(org.company_name || '');
    setEditCode(org.company_code || '');
    setEditContactName(org.primary_contact_name || '');
    setEditEmail(org.email || '');
    setEditPhone(org.phone || '');
    setEditCountry(org.country || '');
    setEditWebsite(org.website || '');
    setEditPlan(org.subscription_plan || 'event_standard');
    setEditLicenses(org.license_count || 5);
    setEditEventId(org.assigned_event_id || eventsList[0]?.id || '');
    setEditStand(org.assigned_stand || '');
    setEditPassword('');
    setShowEditPassword(false);
    setIsEditModalOpen(true);
  };

  const handleUpdateExhibitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExhibitor || !editName.trim() || !editCode.trim() || !editEmail.trim()) return;

    setIsUpdating(true);

    const targetEv = eventsList.find((ev) => ev.id === editEventId) || eventsList[0];
    const eventId = targetEv?.id || editingExhibitor.assigned_event_id;
    const eventNameStr = targetEv?.event_name || editingExhibitor.assigned_event_name;
    const standStr = editStand.trim() || editingExhibitor.assigned_stand || 'Stand TBD';

    const updatedOrg: Organization = {
      ...editingExhibitor,
      company_name: editName.trim(),
      company_code: editCode.trim().toUpperCase(),
      primary_contact_name: editContactName.trim() || undefined,
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim() || undefined,
      country: editCountry.trim() || '',
      website: editWebsite.trim() || undefined,
      subscription_plan: editPlan,
      license_count: Number(editLicenses) || 5,
      assigned_event_id: eventId,
      assigned_event_name: eventNameStr,
      assigned_stand: standStr,
      updated_at: new Date().toISOString(),
    };

    // 1. Optimistic UI & Local Storage
    const updatedList = exhibitors.map((ex) => (ex.id === editingExhibitor.id ? updatedOrg : ex));
    setExhibitors(updatedList);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_exhibitors', JSON.stringify(updatedList));

        // Update credentials in lead2b_registered_users if password or email changed
        const cleanAdminEmail = updatedOrg.email.toLowerCase();
        const customStored = localStorage.getItem('lead2b_registered_users');
        const registered = customStored ? JSON.parse(customStored) : {};

        // Find existing user entry if any
        const oldEmail = editingExhibitor.email.toLowerCase();
        const existingUser = registered[cleanAdminEmail] || registered[oldEmail] || {};

        registered[cleanAdminEmail] = {
          ...existingUser,
          id: existingUser.id || `u_${Date.now()}`,
          email: cleanAdminEmail,
          full_name: updatedOrg.primary_contact_name || updatedOrg.company_name,
          system_role: 'exhibitor_admin',
          tenant_id: updatedOrg.id,
          booth_number: updatedOrg.assigned_stand?.replace('Stand ', ''),
          is_active: true,
          password: editPassword.trim() ? editPassword.trim() : (existingUser.password || 'Password123!'),
        };

        if (oldEmail !== cleanAdminEmail && registered[oldEmail]) {
          delete registered[oldEmail];
        }

        localStorage.setItem('lead2b_registered_users', JSON.stringify(registered));

        // Update license package if present
        const storedLics = localStorage.getItem('lead2b_admin_licenses');
        if (storedLics) {
          const lics: License[] = JSON.parse(storedLics);
          const updatedLics = lics.map((l) =>
            l.tenant_id === updatedOrg.id
              ? { ...l, tenant_name: updatedOrg.company_name, plan: updatedOrg.subscription_plan, allowed_users: updatedOrg.license_count }
              : l
          );
          localStorage.setItem('lead2b_admin_licenses', JSON.stringify(updatedLics));
        }
      } catch (err) {}
    }

    // 2. Persist to Supabase
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase
          .from('organizations')
          .update({
            company_name: updatedOrg.company_name,
            company_code: updatedOrg.company_code,
            primary_contact_name: updatedOrg.primary_contact_name,
            email: updatedOrg.email,
            phone: updatedOrg.phone,
            country: updatedOrg.country,
            website: updatedOrg.website,
            subscription_plan: updatedOrg.subscription_plan,
            license_count: updatedOrg.license_count,
            assigned_event_id: updatedOrg.assigned_event_id,
            assigned_event_name: updatedOrg.assigned_event_name,
            assigned_stand: updatedOrg.assigned_stand,
            updated_at: updatedOrg.updated_at,
          })
          .eq('id', editingExhibitor.id);
      } catch (sbErr) {
        console.warn('Supabase organization update error:', sbErr);
      }
    }

    setIsUpdating(false);
    setIsEditModalOpen(false);
    setEditingExhibitor(null);
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

    if (typeof window !== 'undefined') {
      try {
        const rawOrg = localStorage.getItem('lead2b_deleted_exhibitor_ids');
        const delList: string[] = rawOrg ? JSON.parse(rawOrg) : [];
        if (!delList.includes(id)) {
          delList.push(id);
          localStorage.setItem('lead2b_deleted_exhibitor_ids', JSON.stringify(delList));
        }
      } catch (e) {}
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight break-normal">Exhibitor Management</h1>
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

      {/* Event Filter & Active Focus Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Filter Event:</span>
          <button
            type="button"
            onClick={() => setSelectedEventId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedEventId === 'all'
                ? 'bg-brand-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Events ({exhibitors.length})
          </button>
          {eventsList.map((ev) => {
            const count = exhibitors.filter((ex) => ex.assigned_event_id === ev.id).length;
            const isSelected = selectedEventId === ev.id || (!selectedEventId && ev.id === (typeof window !== 'undefined' ? localStorage.getItem('lead2b_active_event_id') : ''));
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedEventId(ev.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-brand-50 border border-brand-300 text-brand-900 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{ev.event_code || ev.event_name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-brand-200/80 text-brand-950 font-black' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
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
              {exhibitors
                .filter((ex) => {
                  if (selectedEventId === 'all') return true;
                  const activeStoredId = typeof window !== 'undefined' ? localStorage.getItem('lead2b_active_event_id') : null;
                  const targetId = selectedEventId || activeStoredId || eventsList[0]?.id;
                  return !targetId || ex.assigned_event_id === targetId;
                })
                .map((ex) => (
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
                        type="button"
                        onClick={() => handleOpenEditExhibitor(ex)}
                        className="p-1 rounded text-slate-400 hover:text-brand-700 hover:bg-brand-50 transition"
                        title="Edit Exhibitor"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
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
              placeholder="e.g. Stand A-101 / Booth 12"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Primary Contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Full Name"
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
              placeholder="e.g. +1 555 000 0000"
            />
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Country / Region"
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

          {/* Exhibitor Portal Credentials */}
          <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
              <Key className="w-3.5 h-3.5 text-teal-700" />
              <span>Exhibitor Portal Login Credentials</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Portal Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Set initial password (e.g. Exhibitor@2026)"
                  required
                  className="w-full h-11 text-xs rounded-xl border border-slate-300 pl-9 pr-10 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The exhibitor admin will use their <strong>work email</strong> and this password to sign into the Exhibitor Portal.
              </p>
            </div>
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

      {/* Edit Exhibitor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExhibitor(null);
        }}
        title="Edit Exhibitor Tenant"
        description="Update company profile, stand allocations, quota packages, and portal credentials"
      >
        <form onSubmit={handleUpdateExhibitor} className="space-y-3.5">
          <Input
            label="Company Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Siemens Global"
            required
          />

          <Input
            label="Company Code (Tenant Identifier)"
            value={editCode}
            onChange={(e) => setEditCode(e.target.value)}
            placeholder="e.g. SIEMENS-01"
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Primary Contact Person"
              value={editContactName}
              onChange={(e) => setEditContactName(e.target.value)}
              placeholder="e.g. Markus Weber"
            />
            <Input
              label="Country"
              value={editCountry}
              onChange={(e) => setEditCountry(e.target.value)}
              placeholder="e.g. Germany"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Admin Login Email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="admin@company.com"
              required
            />
            <Input
              label="Direct Phone"
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+971 50 123 4567"
            />
          </div>

          <Input
            label="Company Website"
            value={editWebsite}
            onChange={(e) => setEditWebsite(e.target.value)}
            placeholder="https://company.com"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Exhibition
              </label>
              <select
                value={editEventId}
                onChange={(e) => setEditEventId(e.target.value)}
                className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                {eventsList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.event_name} ({ev.event_code})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Assigned Stand / Booth"
              value={editStand}
              onChange={(e) => setEditStand(e.target.value)}
              placeholder="e.g. Stand H3-B24 or TK-01"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subscription Plan
              </label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
                className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="event_standard">Standard Plan</option>
                <option value="event_pro">Pro Plan</option>
                <option value="enterprise">Enterprise VIP</option>
              </select>
            </div>

            <Input
              label="Rep License Count"
              type="number"
              value={editLicenses}
              onChange={(e) => setEditLicenses(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>

          {/* Reset / Update Exhibitor Portal Password */}
          <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Key className="w-3.5 h-3.5 text-brand-600" />
              <span>Update Exhibitor Portal Password (Optional)</span>
            </div>
            <div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current password, or enter new"
                  className="w-full h-11 text-xs rounded-xl border border-slate-300 pl-9 pr-10 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter a new password only if the exhibitor needs their login credentials reset.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingExhibitor(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Update Exhibitor'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
