'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Organization } from '@/lib/types';
import { Building2, Plus, ShieldCheck, Mail, Phone, Globe, Edit2, CheckCircle2 } from 'lucide-react';

export default function AdminExhibitorsPage() {
  const [exhibitors, setExhibitors] = useState<Organization[]>([
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
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('event_standard');
  const [licenses, setLicenses] = useState(5);

  const handleAddExhibitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !email) return;

    const newExhibitor: Organization = {
      id: `org_${Date.now()}`,
      company_name: name,
      company_code: code.toUpperCase(),
      primary_contact_name: contactName,
      email,
      phone,
      active_status: true,
      subscription_plan: plan,
      license_count: Number(licenses),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setExhibitors([...exhibitors, newExhibitor]);
    setIsAddModalOpen(false);
    setName('');
    setCode('');
    setEmail('');
  };

  const toggleStatus = (id: string) => {
    setExhibitors(
      exhibitors.map((ex) => (ex.id === id ? { ...ex, active_status: !ex.active_status } : ex))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Tenant Management</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exhibitor Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Onboard exhibitors, assign booths, configure licenses, and manage multi-tenant access.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="text-xs font-bold gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Exhibitor Tenant</span>
        </Button>
      </div>

      {/* Exhibitors Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Company & Code</th>
              <th className="p-3">Primary Contact</th>
              <th className="p-3">Assigned Event & Booth</th>
              <th className="p-3">Plan & Licenses</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exhibitors.map((ex) => (
              <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {ex.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div>{ex.company_name}</div>
                      <div className="text-[11px] font-mono text-slate-400 font-normal">{ex.company_code}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-slate-800">{ex.primary_contact_name}</div>
                  <div className="text-[11px] text-slate-400">{ex.email}</div>
                </td>
                <td className="p-3">
                  <span className="font-semibold text-slate-700">GITEX Global 2026</span>
                  <div className="text-[11px] font-mono text-slate-500">Stand H3-B24</div>
                </td>
                <td className="p-3">
                  <span className="font-bold text-slate-900">{ex.license_count} Users</span>
                  <div className="text-[11px] text-slate-400 font-mono uppercase">{ex.subscription_plan}</div>
                </td>
                <td className="p-3">
                  <Badge variant={ex.active_status ? 'synced' : 'default'}>
                    {ex.active_status ? 'Active' : 'Suspended'}
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => toggleStatus(ex.id)}
                    className="text-xs font-semibold text-blue-600 hover:underline mr-2"
                  >
                    {ex.active_status ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add Exhibitor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Exhibitor Tenant"
        description="Creates tenant partition, branding container, and root admin access"
      >
        <form onSubmit={handleAddExhibitor} className="space-y-3">
          <Input
            label="Company Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Siemens Global"
            required
          />

          <Input
            label="Company Code (Unique Tenant Identifier)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. SIEMENS-01"
            required
          />

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
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Subscription Tier
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full h-11 text-xs rounded-lg border border-slate-300 px-3 bg-white"
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
            <Button type="submit" variant="primary" className="flex-1 font-bold">
              Create Exhibitor Tenant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
