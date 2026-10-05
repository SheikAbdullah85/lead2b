'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_LICENSES } from '@/lib/data/mock-store';
import { License, Organization } from '@/lib/types';
import { useAuth } from '@/lib/auth/context';
import { ShieldCheck, Plus, CheckCircle2, Clock, Users, Database, Sparkles, Key, Trash2, RefreshCw, Building2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function AdminLicensesPage() {
  const { user, isDemoMode } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New License State
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [tenantName, setTenantName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState('event_standard');
  const [allowedUsers, setAllowedUsers] = useState(5);
  const [leadLimit, setLeadLimit] = useState(5000);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [dateError, setDateError] = useState<string | null>(null);

  const loadLicenses = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Organizations to link tenant details
      let orgs: Organization[] = [];
      let localOrgs: Organization[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_exhibitors');
        if (stored) {
          try { localOrgs = JSON.parse(stored); } catch (e) {}
        }
      }

      let serverOrgs: Organization[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const { data: dbOrgs } = await supabase.from('organizations').select('*');
          if (dbOrgs && dbOrgs.length > 0) serverOrgs = dbOrgs as Organization[];
        } catch (e) {}
      }

      const seenOrgIds = new Set<string>();
      for (const org of [...serverOrgs, ...localOrgs]) {
        if (!seenOrgIds.has(org.id)) {
          seenOrgIds.add(org.id);
          orgs.push(org);
        }
      }
      setOrganizations(orgs);
      if (orgs.length > 0 && !selectedTenantId) {
        setSelectedTenantId(orgs[0].id);
        setTenantName(orgs[0].company_name);
      }

      // 2. Read licenses from localStorage
      let localList: License[] = [];
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_admin_licenses');
        if (stored) {
          try {
            localList = JSON.parse(stored);
          } catch (e) {}
        }
      }

      // 3. Read licenses from Supabase
      let serverList: License[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const { data: dbLicenses } = await supabase
            .from('licenses')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbLicenses && dbLicenses.length > 0) {
            serverList = dbLicenses as License[];
          }
        } catch (e) {}
      }

      // 4. Merge licenses and map company names
      const allFound = isDemoMode
        ? [...serverList, ...localList, ...INITIAL_LICENSES]
        : [...serverList, ...localList];
      const seenTenantIds = new Set<string>();
      const seenLicIds = new Set<string>();
      const merged: License[] = [];

      // Process direct licenses
      for (const lic of allFound) {
        const matchedOrg = orgs.find((o) => o.id === lic.tenant_id);
        const resolvedName = lic.tenant_name || matchedOrg?.company_name || 'Exhibitor Stand';
        const normKey = `${lic.tenant_id}_${resolvedName.trim().toLowerCase()}`;

        if (!seenLicIds.has(lic.id) && !seenTenantIds.has(normKey)) {
          seenLicIds.add(lic.id);
          seenTenantIds.add(normKey);
          merged.push({
            ...lic,
            tenant_name: resolvedName,
          });
        }
      }

      // 5. In live mode, orgs without an explicit license in DB simply have no license card.
      // In demo mode, generate a default license card for any org that lacks one.
      if (isDemoMode) {
        for (const org of orgs) {
          const hasLicense = merged.some(
            (m) => m.tenant_id === org.id || m.tenant_name?.toLowerCase() === org.company_name.toLowerCase()
          );
          if (!hasLicense) {
            const defaultLic: License = {
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : org.id,
              tenant_id: org.id,
              tenant_name: org.company_name,
              plan: org.subscription_plan || 'event_standard',
              allowed_events: 1,
              allowed_users: org.license_count || 5,
              lead_limit: 5000,
              start_date: '2026-10-01',
              expiry_date: '2026-11-01',
              is_active: org.active_status !== false,
              created_at: org.created_at || new Date().toISOString(),
            };
            merged.push(defaultLic);
          }
        }
      }

      setLicenses(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lead2b_admin_licenses', JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('Error hydrating licenses:', err);
      setLicenses(isDemoMode ? INITIAL_LICENSES : []);
    } finally {
      setIsLoading(false);
    }
  };

  const [filterEventId, setFilterEventId] = useState<string>('active');

  useEffect(() => {
    loadLicenses();

    const handleEventChange = () => {
      loadLicenses();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('lead2b_event_changed', handleEventChange);
      return () => window.removeEventListener('lead2b_event_changed', handleEventChange);
    }
  }, [isDemoMode]);

  const handleSelectOrgChange = (orgId: string) => {
    setSelectedTenantId(orgId);
    const org = organizations.find((o) => o.id === orgId);
    if (org) {
      setTenantName(org.company_name);
      setPlan(org.subscription_plan || 'event_standard');
      setAllowedUsers(org.license_count || 5);
      if (org.email) setAdminEmail(org.email);
    }
  };

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);
    if (!tenantName.trim()) return;

    if (startDate && expiryDate && startDate > expiryDate) {
      setDateError('Invalid date range: License start date cannot be later than expiry date.');
      return;
    }

    setIsSaving(true);
    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '55555555-5555-5555-5555-555555555555';

    const tenantIdToUse =
      selectedTenantId ||
      organizations.find((o) => o.company_name.toLowerCase() === tenantName.toLowerCase())?.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '66666666-6666-6666-6666-666666666666');

    const newLic: License = {
      id: newId,
      tenant_id: tenantIdToUse,
      tenant_name: tenantName.trim(),
      plan,
      allowed_events: 1,
      allowed_users: Number(allowedUsers) || 5,
      lead_limit: Number(leadLimit) || 5000,
      start_date: startDate,
      expiry_date: expiryDate,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // 1. Optimistic UI & Local Storage (replace any existing license for this tenant)
    const updated = [newLic, ...licenses.filter((l) => l.tenant_id !== tenantIdToUse)];
    setLicenses(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_admin_licenses', JSON.stringify(updated));

        // Provision / Update Exhibitor Portal Login Password if provided
        if (portalPassword.trim()) {
          const orgMatch = organizations.find((o) => o.id === tenantIdToUse);
          const targetEmail = (adminEmail.trim() || orgMatch?.email || '').toLowerCase();
          if (targetEmail) {
            const customStored = localStorage.getItem('lead2b_registered_users');
            const registered = customStored ? JSON.parse(customStored) : {};
            registered[targetEmail] = {
              ...registered[targetEmail],
              id: registered[targetEmail]?.id || `u_${Date.now()}`,
              email: targetEmail,
              full_name: orgMatch?.primary_contact_name || newLic.tenant_name,
              system_role: 'exhibitor_admin',
              tenant_id: newLic.tenant_id,
              booth_number: orgMatch?.assigned_stand?.replace('Stand ', ''),
              is_active: true,
              password: portalPassword.trim(),
            };
            localStorage.setItem('lead2b_registered_users', JSON.stringify(registered));
          }
        }
      } catch (e) {}
    }

    // 2. Persist to Supabase PostgreSQL
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const { error } = await supabase.from('licenses').upsert([
          {
            id: newLic.id,
            tenant_id: newLic.tenant_id,
            plan: newLic.plan,
            allowed_events: newLic.allowed_events,
            allowed_users: newLic.allowed_users,
            lead_limit: newLic.lead_limit,
            start_date: newLic.start_date,
            expiry_date: newLic.expiry_date,
            is_active: true,
          },
        ]);
        if (error) {
          console.warn('Supabase license upsert notice:', error.message);
        }
      } catch (err) {
        console.warn('Failed to insert license into Supabase:', err);
      }
    }

    setIsSaving(false);
    setIsAddModalOpen(false);
    setPortalPassword('');
  };

  const handleDeleteLicense = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to revoke license package for "${name}"?`)) return;

    const remaining = licenses.filter((lic) => lic.id !== id);
    setLicenses(remaining);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_admin_licenses', JSON.stringify(remaining));
      } catch (e) {}
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('licenses').delete().eq('id', id);
      } catch (err) {
        console.warn('Failed to delete license from Supabase:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Key className="w-3 h-3 text-brand-600" />
            Booth & Quota Provisioning
          </span>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight break-normal">License & Quota Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Per-event exhibitor packages, seat allocations, and lead capture ceilings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLicenses}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Refresh licenses from server"
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
            <span>Issue License Package</span>
          </Button>
        </div>
      </div>

      {/* Event Scope Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Filter Event:</span>
          <button
            type="button"
            onClick={() => setFilterEventId('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterEventId === 'active'
                ? 'bg-brand-50 border border-brand-300 text-brand-900 shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Selected Event Focus</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterEventId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterEventId === 'all'
                ? 'bg-brand-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Exhibitions ({licenses.length})
          </button>
        </div>
      </div>

      {/* Licenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {licenses
          .filter((lic) => {
            if (filterEventId === 'all') return true;
            const activeStoredId = typeof window !== 'undefined' ? localStorage.getItem('lead2b_active_event_id') : null;
            if (!activeStoredId) return true;
            const matchedOrg = organizations.find((o) => o.id === lic.tenant_id);
            if (!matchedOrg) return true;
            return matchedOrg.assigned_event_id === activeStoredId;
          })
          .map((lic) => (
          <Card key={lic.id} className="border-slate-200/90 shadow-2xs hover:border-brand-300 transition relative group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-800 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-md">
                    {lic.plan}
                  </span>
                  <CardTitle className="text-lg font-black mt-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>{lic.tenant_name || 'Exhibitor Stand'}</span>
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={lic.is_active ? 'synced' : 'default'}>
                    {lic.is_active ? 'ACTIVE' : 'EXPIRED'}
                  </Badge>
                  <button
                    onClick={() => handleDeleteLicense(lic.id, lic.tenant_name || 'this stand')}
                    className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Revoke / Delete License"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2 text-xs text-slate-600">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">User Seats</span>
                  <span className="text-base font-black text-slate-900">{lic.allowed_users} Reps</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead Limit</span>
                  <span className="text-base font-black text-brand-700">{lic.lead_limit?.toLocaleString() || 'Unlimited'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Events</span>
                  <span className="text-base font-black text-slate-900">{lic.allowed_events || 1} Event</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 font-mono text-[11px]">
                <span>Valid: {lic.start_date}</span>
                <span>Expires: {lic.expiry_date}</span>
              </div>
            </CardContent>
          </Card>
        ))}

        {licenses.length === 0 && !isLoading && (
          <div className="col-span-2 text-center py-12 text-slate-400">
            No active licenses found. Click &quot;Issue License Package&quot; to allocate seats.
          </div>
        )}
      </div>

      {/* Issue License Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Issue Exhibition License"
        description="Allocate booth seats and lead thresholds for an exhibitor"
      >
        <form onSubmit={handleAddLicense} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Select Exhibitor Organization
            </label>
            {organizations.length > 0 ? (
              <select
                value={selectedTenantId}
                onChange={(e) => handleSelectOrgChange(e.target.value)}
                className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                required
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.company_name} ({org.company_code})
                  </option>
                ))}
              </select>
            ) : (
              <Input
                label="Exhibitor Organization Name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Package Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="event_standard">Event Standard (5 Users / 5,000 Leads)</option>
              <option value="event_pro">Event Pro (10 Users / 10,000 Leads)</option>
              <option value="annual_enterprise">Annual Enterprise (Unlimited Leads)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Allowed Sales Reps"
              type="number"
              value={allowedUsers}
              onChange={(e) => setAllowedUsers(Number(e.target.value))}
              required
            />
            <Input
              label="Max Leads Limit"
              type="number"
              value={leadLimit}
              onChange={(e) => setLeadLimit(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="Valid From"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateError(null);
                }}
                required
              />
              <Input
                label="Expires On"
                type="date"
                value={expiryDate}
                min={startDate || undefined}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setDateError(null);
                }}
                required
              />
            </div>
            {dateError && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg animate-in fade-in">
                {dateError}
              </p>
            )}
          </div>

          {/* Exhibitor Portal Credentials */}
          <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
              <Key className="w-3.5 h-3.5 text-teal-700" />
              <span>Exhibitor Portal Login Password</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Portal Password (Set or Update)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Set exhibitor password (e.g. Exhibitor@2026)"
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
                Sets the initial login password for the exhibitor administrator account.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isSaving}>
              {isSaving ? 'Issuing...' : 'Issue License'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
