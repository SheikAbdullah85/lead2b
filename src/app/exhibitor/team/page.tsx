'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Users, UserPlus, QrCode, Mail, Copy, Check, Shield, Smartphone } from 'lucide-react';

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Booth Sales Team</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage representatives, access credentials, and monitor lead capture activity at GITEX Booth H3-B24.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsQrModalOpen(true)}
            className="text-xs font-semibold gap-1.5 bg-white"
          >
            <QrCode className="w-3.5 h-3.5 text-blue-600" />
            <span>Join Team via QR</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            className="text-xs font-bold gap-1.5 shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Representative</span>
          </Button>
        </div>
      </div>

      {/* Team Quota Progress Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">License Quota</span>
            <h3 className="text-base font-bold text-slate-900">
              {members.length} of 10 Representative Licenses Active
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Plan: <strong>Event Pro (GITEX 2026)</strong> • 7 licenses available
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="text-xs font-semibold gap-1.5 bg-white"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Team Onboarding Link'}</span>
          </Button>
        </div>
      </Card>

      {/* Team Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Team Member</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Leads Captured</th>
              <th className="p-3">Last Active</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3 font-semibold text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div>{m.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    m.role === 'exhibitor_admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {m.role === 'exhibitor_admin' ? 'Admin' : 'Sales Rep'}
                  </span>
                </td>
                <td className="p-3">
                  <Badge variant={m.status === 'active' ? 'synced' : 'pending'}>
                    {m.status === 'active' ? 'Active' : 'Invited'}
                  </Badge>
                </td>
                <td className="p-3 font-bold text-slate-900">
                  <span className="text-sm font-black text-blue-600">{m.leadsCount}</span> leads
                </td>
                <td className="p-3 text-slate-500 font-mono">{m.lastActive}</td>
                <td className="p-3 text-right">
                  <button className="text-xs text-slate-500 hover:text-slate-800 font-medium">
                    Edit Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Booth Representative"
        description="Send an email invitation with instant booth onboarding credentials"
      >
        <form onSubmit={handleSendInvite} className="space-y-3">
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Role Permission
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="w-full h-11 text-xs rounded-lg border border-slate-300 px-3 bg-white"
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

      {/* Join Team via QR Modal matching prompt specifications */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Join Team via QR"
        description="Sales reps scan this code on their phone to be assigned to this booth instantly"
      >
        <div className="flex flex-col items-center text-center p-2 space-y-4">
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-300 shadow-lg">
            {/* SVG simulated QR code */}
            <svg className="w-48 h-48" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="#ffffff" />
              {/* Corner markers */}
              <rect x="5" y="5" width="25" height="25" fill="#0f172a" />
              <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
              <rect x="13" y="13" width="9" height="9" fill="#0f172a" />
              <rect x="70" y="5" width="25" height="25" fill="#0f172a" />
              <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
              <rect x="78" y="13" width="9" height="9" fill="#0f172a" />
              <rect x="5" y="70" width="25" height="25" fill="#0f172a" />
              <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
              <rect x="13" y="78" width="9" height="9" fill="#0f172a" />
              {/* Pattern data blocks */}
              <rect x="35" y="10" width="10" height="10" fill="#2563eb" />
              <rect x="50" y="20" width="15" height="10" fill="#0f172a" />
              <rect x="35" y="35" width="30" height="30" fill="#0f172a" />
              <rect x="42" y="42" width="16" height="16" fill="#ffffff" />
              <rect x="46" y="46" width="8" height="8" fill="#2563eb" />
              <rect x="70" y="45" width="10" height="25" fill="#0f172a" />
              <rect x="40" y="75" width="20" height="15" fill="#0f172a" />
              <rect x="70" y="75" width="15" height="15" fill="#2563eb" />
            </svg>
          </div>

          <div className="text-xs space-y-1 text-slate-600">
            <p className="font-bold text-slate-900">Event: GITEX Global 2026 • Booth H3-B24</p>
            <p className="text-slate-400">QR token expires in 24 hours • Never exposes master keys</p>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsQrModalOpen(false)} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
