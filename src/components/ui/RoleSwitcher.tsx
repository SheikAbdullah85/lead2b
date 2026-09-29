'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { SystemRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Shield, UserCheck, Building2, Smartphone, ChevronDown, Check, Sparkles } from 'lucide-react';

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const roles: { role: SystemRole; label: string; route: string; icon: any; color: string; badge: string }[] = [
    {
      role: 'sales_rep',
      label: 'Sales Rep (Mobile PWA)',
      route: '/app/dashboard',
      icon: Smartphone,
      color: 'text-teal-700 bg-teal-50 border-teal-200/80',
      badge: 'Booth Rep',
    },
    {
      role: 'exhibitor_admin',
      label: 'Exhibitor Portal Admin',
      route: '/exhibitor/dashboard',
      icon: Building2,
      color: 'text-slate-800 bg-slate-100 border-slate-300',
      badge: 'Exhibitor Admin',
    },
    {
      role: 'organizer_admin',
      label: 'Event Organizer Admin',
      route: '/admin/dashboard',
      icon: UserCheck,
      color: 'text-amber-700 bg-amber-50 border-amber-200/80',
      badge: 'GITEX Organizer',
    },
    {
      role: 'super_admin',
      label: 'Super Admin (lead2b)',
      route: '/admin/dashboard',
      icon: Shield,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      badge: 'Super Admin',
    },
  ];

  const handleSelectRole = (role: SystemRole, route: string) => {
    switchRole(role);
    setIsOpen(false);
    router.push(route);
  };

  const currentConfig = roles.find((r) => r.role === user.system_role) || roles[0];
  const Icon = currentConfig.icon;

  return (
    <div className="fixed top-2.5 right-2.5 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md border backdrop-blur-md transition-all hover:scale-105 active:scale-95 ${currentConfig.color}`}
          title="Switch Portal & Persona"
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium text-slate-700">{user.full_name} •</span>
          <span>{currentConfig.badge}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white p-2.5 shadow-2xl border border-slate-200/90 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span>Switch Portal Persona</span>
              <span className="text-teal-600 font-bold">1-Click Test</span>
            </div>

            <div className="mt-1.5 space-y-1">
              {roles.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = user.system_role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item.role, item.route)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <ItemIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="leading-tight font-bold">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{item.route}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
