'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useBranding } from '@/lib/branding/context';
import { Logo } from '@/components/ui/Logo';
import { Building2, Calendar, QrCode, LogOut, LayoutDashboard, Users, FileSpreadsheet, Sliders, ShieldCheck, ExternalLink, Menu, X } from 'lucide-react';

interface PortalHeaderProps {
  type: 'admin' | 'exhibitor';
}

export function PortalHeader({ type }: PortalHeaderProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const exhibitorLinks = [
    { label: 'Overview', href: '/exhibitor/dashboard', icon: LayoutDashboard },
    { label: 'Leads Directory', href: '/exhibitor/leads', icon: Users },
    { label: 'Booth Team', href: '/exhibitor/team', icon: Building2 },
    { label: 'Lead Forms', href: '/exhibitor/forms', icon: Sliders },
    { label: 'Reports', href: '/exhibitor/reports', icon: FileSpreadsheet },
    { label: 'CRM & Webhooks', href: '/exhibitor/integrations', icon: ShieldCheck },
    { label: 'White-Label', href: '/exhibitor/settings', icon: Sliders },
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Official Logo & Portal Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href={type === 'admin' ? '/admin/dashboard' : '/exhibitor/dashboard'} className="flex items-center gap-2 sm:gap-3">
              <Logo size="md" />
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 px-2 py-0.5 bg-brand-50 border border-brand-200/80 rounded-full shrink-0">
                {type === 'admin' ? 'Organizer' : 'Exhibitor'}
              </span>
            </Link>

            {/* Active Exhibition Badge (visible on desktop) */}
            <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                {type === 'exhibitor' ? branding.company_name : 'GITEX Global 2026'}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-semibold px-2 py-0.5 rounded border border-slate-200">
                Stand H3-B24
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (>=1024px) */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-900 border border-brand-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Shortcuts & Profile */}
          <div className="flex items-center gap-2">
            {user?.system_role === 'super_admin' && (
              <div className="flex items-center gap-1.5">
                {type === 'exhibitor' ? (
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-200/80 hover:bg-indigo-100 transition shadow-2xs"
                    title="Switch to Organizer Admin Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Organizer Admin</span>
                    <span className="sm:hidden">Organizer</span>
                  </Link>
                ) : (
                  <Link
                    href="/exhibitor/dashboard"
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-900 border border-teal-200/80 hover:bg-teal-100 transition shadow-2xs"
                    title="Switch to Exhibitor Portal"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">Exhibitor Portal</span>
                    <span className="sm:hidden">Exhibitor</span>
                  </Link>
                )}
              </div>
            )}

            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 transition shadow-sm active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden sm:inline">Launch App</span>
              <span className="sm:hidden">App</span>
            </Link>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Horizontal Navigation Strip for Tablet & Mobile (under 1024px) */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/80 px-4 py-2 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition ${
                isActive
                  ? 'bg-white text-brand-800 shadow-2xs border border-brand-200/60 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
