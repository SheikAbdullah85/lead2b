'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Users, UserPlus, QrCode, Mail, Copy, Check, Shield, Smartphone, Sparkles, Building2, Trash2, RefreshCw, Plus, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { getActiveEvent, getActiveTenant } from '@/lib/events/active-event';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'exhibitor_admin' | 'sales_rep';
  leadsCount: number;
  status: 'active' | 'pending';
  lastActive: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'm1',
    name: 'Asma',
    email: 'asma89@gmail.com',
    role: 'exhibitor_admin',
    leadsCount: 14,
    status: 'active',
    lastActive: 'Just now',
  },
  {
    id: 'm2',
    name: 'Sheik Abdullah',
    email: 'sheik85@gmail.com',
    role: 'exhibitor_admin',
    leadsCount: 38,
    status: 'active',
    lastActive: 'Active today',
  },
];

export default function ExhibitorTeamPage() {
  const { isDemoMode } = useAuth();
  const [activeEvent, setActiveEvent] = useState(getActiveEvent());
  const [activeTenant, setActiveTenant] = useState(getActiveTenant());
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'sales_rep' | 'exhibitor_admin'>('sales_rep');

  // Direct Create User Modal State
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'sales_rep' | 'exhibitor_admin'>('sales_rep');
  const [newUserPassword, setNewUserPassword] = useState('Password123!');
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const inviteLink = `https://www.dxb.llc/invite/JOIN-${activeTenant.code}-${activeEvent.code}`;

  const getDeletedMemberKeys = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem('lead2b_deleted_team_member_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  };

  const markMemberDeleted = (idOrEmail: string) => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('lead2b_deleted_team_member_ids');
        const list: string[] = raw ? JSON.parse(raw) : [];
        const clean = idOrEmail.toLowerCase();
        if (!list.includes(clean)) {
          list.push(clean);
          localStorage.setItem('lead2b_deleted_team_member_ids', JSON.stringify(list));
        }
      } catch (e) {}
    }
  };

  const loadTeamMembers = async () => {
    setIsLoading(true);
    const deletedKeys = getDeletedMemberKeys();

    try {
      let storedList: TeamMember[] = [];
      let hasStored = false;
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_exhibitor_team');
        if (stored) {
          hasStored = true;
          try {
            storedList = JSON.parse(stored);
          } catch (e) {}
        }
      }

      let serverList: TeamMember[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const { data: dbProfiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('tenant_id', activeTenant.id);

        if (dbProfiles && dbProfiles.length > 0) {
          serverList = dbProfiles.map((p: any) => ({
            id: p.id,
            name: p.full_name || p.email.split('@')[0],
            email: p.email,
            role: (p.system_role as any) || 'sales_rep',
            leadsCount: 0,
            status: p.is_active ? 'active' : 'pending',
            lastActive: 'Active today',
          }));
        }
      }

      const seen = new Set<string>();
      const merged: TeamMember[] = [];

      // Only seed DEFAULT_MEMBERS in demo mode or if no local store exists
      const fallbackDefaults = isDemoMode
        ? (hasStored || serverList.length > 0 ? [] : DEFAULT_MEMBERS)
        : [];

      for (const m of [...serverList, ...storedList, ...fallbackDefaults]) {
        const key = m.email.toLowerCase();
        const idKey = m.id.toLowerCase();
        if (!seen.has(key) && !deletedKeys.has(key) && !deletedKeys.has(idKey)) {
          seen.add(key);
          merged.push(m);
        }
      }

      setMembers(merged);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lead2b_exhibitor_team', JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('Error loading team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, [isDemoMode]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const cleanEmail = inviteEmail.trim().toLowerCase();
    const newMemberId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `m-${Date.now()}-0000-0000-000000000001`;

    const newMember: TeamMember = {
      id: newMemberId,
      name: inviteName.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: inviteRole,
      leadsCount: 0,
      status: 'pending',
      lastActive: 'Invite Sent',
    };

    const updated = [newMember, ...members];
    setMembers(updated);

    // 1. Store locally in exhibitor team
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_exhibitor_team', JSON.stringify(updated));
      } catch (err) {}
    }

    // 2. Store credential for instant login with Password123!
    try {
      const customStored = localStorage.getItem('lead2b_registered_users');
      const registered = customStored ? JSON.parse(customStored) : {};
      registered[cleanEmail] = {
        id: newMemberId,
        email: cleanEmail,
        full_name: newMember.name,
        system_role: inviteRole,
        tenant_id: '11111111-1111-1111-1111-111111111111',
        is_active: true,
        created_at: new Date().toISOString(),
        password: 'Password123!',
      };
      localStorage.setItem('lead2b_registered_users', JSON.stringify(registered));
    } catch (err) {}

    // 3. Persist to Supabase profiles
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('profiles').upsert([
          {
            id: newMemberId,
            email: cleanEmail,
            full_name: newMember.name,
            system_role: inviteRole,
            tenant_id: '11111111-1111-1111-1111-111111111111',
            is_active: true,
          },
        ]);
      } catch (err) {
        console.warn('Failed to upsert profile in Supabase:', err);
      }
    }

    setIsInviteModalOpen(false);
    setInviteEmail('');
    setInviteName('');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserName.trim()) return;

    setIsCreatingUser(true);
    const cleanEmail = newUserEmail.trim().toLowerCase();
    const newMemberId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `m-${Date.now()}-0000-0000-000000000001`;

    const newMember: TeamMember = {
      id: newMemberId,
      name: newUserName.trim(),
      email: cleanEmail,
      role: newUserRole,
      leadsCount: 0,
      status: 'active',
      lastActive: 'Active now',
    };

    const updated = [newMember, ...members];
    setMembers(updated);

    // 1. Store locally in exhibitor team
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_exhibitor_team', JSON.stringify(updated));

        // 2. Provision login credentials immediately
        const customStored = localStorage.getItem('lead2b_registered_users');
        const registered = customStored ? JSON.parse(customStored) : {};
        registered[cleanEmail] = {
          id: newMemberId,
          email: cleanEmail,
          full_name: newMember.name,
          system_role: newUserRole,
          tenant_id: activeTenant.id || '11111111-1111-1111-1111-111111111111',
          booth_number: activeTenant.stand?.replace('Stand ', ''),
          is_active: true,
          created_at: new Date().toISOString(),
          password: newUserPassword.trim() || 'Password123!',
        };
        localStorage.setItem('lead2b_registered_users', JSON.stringify(registered));
      } catch (err) {}
    }

    // 3. Persist to Supabase profiles
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('profiles').upsert([
          {
            id: newMemberId,
            email: cleanEmail,
            full_name: newMember.name,
            system_role: newUserRole,
            tenant_id: activeTenant.id || '11111111-1111-1111-1111-111111111111',
            is_active: true,
          },
        ]);
      } catch (err) {
        console.warn('Failed to upsert profile in Supabase:', err);
      }
    }

    setIsCreatingUser(false);
    setIsCreateUserModalOpen(false);
    setNewUserEmail('');
    setNewUserName('');
    setNewUserPassword('Password123!');
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this booth?`)) return;

    const target = members.find((m) => m.id === id);
    if (target) {
      markMemberDeleted(target.id);
      markMemberDeleted(target.email);
    } else {
      markMemberDeleted(id);
    }

    const remaining = members.filter((m) => m.id !== id);
    setMembers(remaining);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_exhibitor_team', JSON.stringify(remaining));
      } catch (e) {}
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
        if (target?.email) {
          await supabase.from('profiles').delete().eq('email', target.email);
        }
      } catch (e) {}
    }
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight break-normal">Booth Sales Team</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage representatives, allocate licenses, and monitor lead capture activity at {activeEvent.name} {activeTenant.stand}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTeamMembers}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
            <span>Refresh</span>
          </Button>

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
            variant="outline"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 hover:border-brand-300"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-600" />
            <span>Invite</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateUserModalOpen(true)}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
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
              Plan: <strong className="text-brand-900 font-bold">Event Pro ({activeEvent.name})</strong> • {Math.max(0, 10 - members.length)} licenses available
            </p>
            <div className="w-64 sm:w-80 bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-gradient-to-r from-brand-600 to-brand-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (members.length / 10) * 100)}%` }}
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
                    <button
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
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
            <p className="font-bold text-slate-900">Event: {activeEvent.name} • {activeTenant.stand}</p>
            <p className="text-slate-400">QR token expires in 24 hours • Enforces booth license limits</p>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsQrModalOpen(false)} className="w-full font-bold">
            Done
          </Button>
        </div>
      </Modal>

      {/* Direct Create User Modal */}
      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={() => setIsCreateUserModalOpen(false)}
        title="Create Booth Team Member"
        description="Provision immediate login credentials for a sales rep or booth administrator"
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <Input
            label="Full Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="e.g. Elena Rostova"
            required
          />

          <Input
            label="Email Address (Login Username)"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="rep@company.com"
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Role Permission
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as any)}
              className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="sales_rep">Sales Representative (Capture & Own Leads)</option>
              <option value="exhibitor_admin">Exhibitor Administrator (Full Access & Export)</option>
            </select>
          </div>

          <div className="p-3 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
              <Key className="w-3.5 h-3.5 text-teal-700" />
              <span>Login Password</span>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type={showNewUserPassword ? 'text' : 'password'}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Set password (e.g. Password123!)"
                  required
                  className="w-full h-11 text-xs rounded-xl border border-slate-300 pl-9 pr-10 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The user can immediately log into the Mobile App or Exhibitor Portal using their email and this password.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateUserModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isCreatingUser}>
              {isCreatingUser ? 'Creating...' : 'Create Team User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
