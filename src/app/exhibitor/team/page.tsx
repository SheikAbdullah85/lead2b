'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Users, UserPlus, QrCode, Mail, Copy, Check, Shield, Smartphone, Sparkles, Building2 } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'exhibitor_admin' | 'sales_rep';
  leadsCount: number;
  status: 'active' | 'pending';
  lastActive: string;
}

export default function ExhibitorTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: 'm1',
      name: 'David Miller',
      email: 'exhibitor@alphatech.com',
      role: 'exhibitor_admin',
      leadsCount: 12,
      status: 'active',
      lastActive: '5 mins ago',
    },
    {
      id: 'm2',
      name: 'Tariq Mansoor',
      email: 'tariq@alphatech.com',
      role: 'sales_rep',
      leadsCount: 28,
      status: 'active',
      lastActive: 'Just now',
    },
    {
      id: 'm3',
      name: 'Sarah Jenkins',
      email: 'sarah@alphatech.com',
      role: 'sales_rep',
      leadsCount: 19,
      status: 'active',
      lastActive: '12 mins ago',
    },
  ]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'sales_rep' | 'exhibitor_admin'>('sales_rep');
  const [copiedLink, setCopiedLink] = useState(false);

  const inviteLink = 'https://app.lead2b.com/invite/JOIN-ALPHA-GITEX26';

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setMembers([
      ...members,
      {
        id: `m_${Date.now()}`,
        name: inviteName || inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        leadsCount: 0,
        status: 'pending',
        lastActive: 'Invite Sent',
      },
    ]);

    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteName('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Users className="w-3 h-3 text-brand-600" />
            Booth Personnel Management
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Booth Sales Team</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage representatives, allocate licenses, and monitor lead capture activity at GITEX Stand H3-B24.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 hover:border-brand-300"
          >
            <QrCode className="w-3.5 h-3.5 text-brand-600" />
            <span>Join Team via QR</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Representative</span>
          </Button>
        </div>
      </div>

      {/* Team Quota Progress Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-brand-50/80 via-white to-slate-50 border-brand-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-700">License Quota</span>
            <h3 className="text-base font-black text-slate-900">
              {members.length} of 10 Representative Licenses Active
            </h3>
            <p className="text-xs text-slate-600">
              Plan: <strong className="text-brand-900 font-bold">Event Pro (GITEX 2026)</strong> • 7 licenses available
            </p>
            <div className="w-64 sm:w-80 bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-brand-600 to-brand-400 h-full rounded-full transition-all"
                style={{ width: `${(members.length / 10) * 100}%` }}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 hover:border-brand-300 self-start sm:self-center"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-brand-600" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Onboarding Link'}</span>
          </Button>
        </div>
      </Card>

      {/* Team Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Team Member</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Leads Captured</th>
                <th className="p-3.5">Last Active</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 leading-snug">{m.name}</div>
                        <div className="text-[11px] font-normal text-slate-400 font-mono">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                      m.role === 'exhibitor_admin'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-brand-50 text-brand-800 border-brand-200/60'
                    }`}>
                      {m.role === 'exhibitor_admin' ? 'Admin' : 'Sales Rep'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <Badge variant={m.status === 'active' ? 'synced' : 'pending'}>
                      {m.status === 'active' ? 'Active' : 'Invited'}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">
                    <span className="text-sm font-black text-brand-700">{m.leadsCount}</span>{' '}
                    <span className="text-slate-400 font-normal">leads</span>
                  </td>
                  <td className="p-3.5 text-slate-500 font-mono">{m.lastActive}</td>
                  <td className="p-3.5 text-right">
                    <button className="text-xs text-brand-700 hover:text-brand-900 font-bold px-2 py-1 rounded hover:bg-brand-50 transition">
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Booth Representative"
        description="Send an email invitation with instant booth onboarding credentials"
      >
        <form onSubmit={handleSendInvite} className="space-y-3.5">
          <Input
            label="Full Name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="e.g. Elena Rostova"
          />

          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="rep@company.com"
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Role Permission
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="sales_rep">Sales Representative (Capture & Own Leads)</option>
              <option value="exhibitor_admin">Exhibitor Administrator (Full Access & Export)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsInviteModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold">
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Team via QR Modal */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Join Team via QR"
        description="Sales reps scan this code on their phone to be assigned to this booth instantly"
      >
        <div className="flex flex-col items-center text-center p-2 space-y-4">
          <div className="p-4 bg-white rounded-3xl border-2 border-brand-200 shadow-xl ring-4 ring-brand-50">
            {/* SVG simulated QR code with brand teal accent */}
            <svg className="w-52 h-52" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="#ffffff" />
              {/* Corner markers */}
              <rect x="5" y="5" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
              <rect x="13" y="13" width="9" height="9" fill="#00838f" />

              <rect x="70" y="5" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
              <rect x="78" y="13" width="9" height="9" fill="#00838f" />

              <rect x="5" y="70" width="25" height="25" rx="3" fill="#0f172a" />
              <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
              <rect x="13" y="78" width="9" height="9" fill="#00838f" />

              {/* Data blocks */}
              <rect x="35" y="10" width="10" height="10" fill="#00838f" />
              <rect x="50" y="20" width="15" height="10" fill="#0f172a" />
              <rect x="35" y="35" width="30" height="30" rx="4" fill="#0f172a" />
              <rect x="42" y="42" width="16" height="16" fill="#ffffff" />
              <rect x="46" y="46" width="8" height="8" rx="2" fill="#00838f" />
              <rect x="70" y="45" width="10" height="25" fill="#0f172a" />
              <rect x="40" y="75" width="20" height="15" fill="#0f172a" />
              <rect x="70" y="75" width="15" height="15" fill="#00838f" />
            </svg>
          </div>

          <div className="text-xs space-y-1 text-slate-600">
            <p className="font-bold text-slate-900">Event: GITEX Global 2026 • Stand H3-B24</p>
            <p className="text-slate-400">QR token expires in 24 hours • Enforces booth license limits</p>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsQrModalOpen(false)} className="w-full font-bold">
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
