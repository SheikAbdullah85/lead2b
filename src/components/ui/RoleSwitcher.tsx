'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { SystemRole } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Shield, UserCheck, Building2, Smartphone, ChevronDown, Check } from 'lucide-react';

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const roles: { role: SystemRole; label: string; route: string; icon: any; color: string }[] = [
    {
      role: 'sales_rep',
      label: 'Sales Rep (Mobile PWA)',
      route: '/app/dashboard',
      icon: Smartphone,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      role: 'exhibitor_admin',
      label: 'Exhibitor Portal Admin',
      route: '/exhibitor/dashboard',
      icon: Building2,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      role: 'organizer_admin',
      label: 'Event Organizer Admin',
      route: '/admin/dashboard',
      icon: UserCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      role: 'super_admin',
      label: 'Super Admin (lead2b)',
      route: '/admin/dashboard',
      icon: Shield,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
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
    <div className="fixed top-3 right-3 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border backdrop-blur-md transition-all ${currentConfig.color}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{user.full_name} •</span>
          <span>{currentConfig.label.split(' ')[0]}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-2 shadow-2xl border border-slate-200 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Switch Persona & Portal
            </div>
            <div className="mt-1 space-y-1">
              {roles.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = user.system_role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => handleSelectRole(item.role, item.route)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition ${
                      isSelected
                        ? 'bg-slate-100 font-semibold text-slate-900'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-4 h-4 text-slate-500" />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
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
