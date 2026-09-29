'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_LICENSES } from '@/lib/data/mock-store';
import { License } from '@/lib/types';
import { ShieldCheck, Plus, CheckCircle2, Clock, Users, Database, Sparkles, Key } from 'lucide-react';

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>(INITIAL_LICENSES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New License State
  const [tenantName, setTenantName] = useState('Alpha Technology Group');
  const [plan, setPlan] = useState('event_pro');
  const [allowedUsers, setAllowedUsers] = useState(10);
  const [leadLimit, setLeadLimit] = useState(5000);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [expiryDate, setExpiryDate] = useState('2026-11-01');

  const handleAddLicense = (e: React.FormEvent) => {
    e.preventDefault();

    const newLic: License = {
      id: `lic_${Date.now()}`,
      tenant_id: '11111111-1111-1111-1111-111111111111',
      tenant_name: tenantName,
      plan,
      allowed_events: 1,
      allowed_users: Number(allowedUsers),
      lead_limit: Number(leadLimit),
      start_date: startDate,
      expiry_date: expiryDate,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setLicenses([newLic, ...licenses]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Key className="w-3 h-3 text-brand-600" />
            SaaS Commercial Provisioning
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">License & Quota Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Per-event exhibitor packages, seat allocations, and lead capture ceilings.
          </p>
        </div>

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

      {/* Licenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {licenses.map((lic) => (
          <Card key={lic.id} className="border-slate-200/90 shadow-2xs hover:border-brand-300 transition">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-800 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-md">
                    {lic.plan}
                  </span>
                  <CardTitle className="text-lg font-black mt-2">{lic.tenant_name}</CardTitle>
                </div>
                <Badge variant={lic.is_active ? 'synced' : 'default'}>
                  {lic.is_active ? 'ACTIVE' : 'EXPIRED'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2 text-xs text-slate-600">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">User Seats</span>
                  <span className="text-base font-black text-slate-900">{lic.allowed_users}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Lead Limit</span>
                  <span className="text-base font-black text-brand-700">{lic.lead_limit.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Events</span>
                  <span className="text-base font-black text-slate-900">{lic.allowed_events}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500 font-mono text-[11px]">
                <span>Valid: {lic.start_date}</span>
                <span>Expires: {lic.expiry_date}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Issue License Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Issue Exhibition License"
        description="Allocate booth seats and lead thresholds for an exhibitor"
      >
        <form onSubmit={handleAddLicense} className="space-y-3.5">
          <Input
            label="Exhibitor Organization"
            value={tenantName}
            onChange={(e) => setTenantName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Package Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="event_standard">Event Standard (5 Users / 2,000 Leads)</option>
              <option value="event_pro">Event Pro (10 Users / 5,000 Leads)</option>
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

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Valid From"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="Expires On"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold">
              Issue License
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
