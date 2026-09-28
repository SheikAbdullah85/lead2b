'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useBranding } from '@/lib/branding/context';
import { Building2, Calendar, QrCode, LogOut, LayoutDashboard, Users, FileSpreadsheet, Sliders, ShieldCheck } from 'lucide-react';

interface PortalHeaderProps {
  type: 'admin' | 'exhibitor';
}

export function PortalHeader({ type }: PortalHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { branding } = useBranding();

  const exhibitorLinks = [
    { label: 'Overview', href: '/exhibitor/dashboard', icon: LayoutDashboard },
    { label: 'Leads Directory', href: '/exhibitor/leads', icon: Users },
    { label: 'Booth Team', href: '/exhibitor/team', icon: Building2 },
    { label: 'Lead Forms', href: '/exhibitor/forms', icon: Sliders },
    { label: 'Reports', href: '/exhibitor/reports', icon: FileSpreadsheet },
    { label: 'CRM & Webhooks', href: '/exhibitor/integrations', icon: ShieldCheck },
    { label: 'Settings', href: '/exhibitor/settings', icon: Sliders },
  ];

  const adminLinks = [
    { label: 'System Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Events & Halls', href: '/admin/events', icon: Calendar },
    { label: 'Exhibitors', href: '/admin/exhibitors', icon: Building2 },
    { label: 'Attendees Import', href: '/admin/attendees', icon: Users },
    { label: 'Licenses', href: '/admin/licenses', icon: ShieldCheck },
    { label: 'Audit Logs', href: '/admin/audit', icon: Sliders },
  ];

  const links = type === 'admin' ? adminLinks : exhibitorLinks;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tenant Identity */}
          <div className="flex items-center gap-4">
            <Link href={type === 'admin' ? '/admin/dashboard' : '/exhibitor/dashboard'} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
                L2
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900">lead2b</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 ml-1.5 px-1.5 py-0.5 bg-blue-50 rounded">
                  {type === 'admin' ? 'Organizer Admin' : 'Exhibitor Portal'}
                </span>
              </div>
            </Link>

            {/* Active Tenant / Event Badge */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="text-xs font-semibold text-slate-700">
                {type === 'exhibitor' ? branding.company_name : 'GITEX Global 2026'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded">
                H3-B24
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/app/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Open Mobile App</span>
            </Link>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
