'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useBranding } from '@/lib/branding/context';
import { Logo } from '@/components/ui/Logo';
import { Building2, Calendar, QrCode, LogOut, LayoutDashboard, Users, FileSpreadsheet, Sliders, ShieldCheck, ExternalLink, Menu, X, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Event } from '@/lib/types';
import { INITIAL_EVENTS, INITIAL_EXHIBITORS } from '@/lib/data/mock-store';

interface PortalHeaderProps {
  type: 'admin' | 'exhibitor';
}

export function PortalHeader({ type }: PortalHeaderProps) {
  const pathname = usePathname();
  const { user, logout, isDemoMode } = useAuth();
  const { branding } = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [exhibitorName, setExhibitorName] = useState('');
  const [standName, setStandName] = useState('');

  // Resolve current active exhibitor name & stand cleanly
  const resolveExhibitor = (evtId?: string) => {
    try {
      const activeEvId = evtId || (typeof window !== 'undefined' ? localStorage.getItem('lead2b_active_event_id') : null);
      const storedEx = typeof window !== 'undefined' ? localStorage.getItem('lead2b_exhibitors') : null;
      const orgs: any[] = storedEx ? JSON.parse(storedEx) : (isDemoMode ? INITIAL_EXHIBITORS : []);

      if (orgs.length > 0) {
        if (activeEvId) {
          const evMatch = orgs.find((o) => o.assigned_event_id === activeEvId);
          if (evMatch && evMatch.company_name) {
            setExhibitorName(evMatch.company_name);
            setStandName(evMatch.assigned_stand || 'Stand Unassigned');
            return;
          }
        }
        const userMatch = orgs.find((o) => o.id === user?.tenant_id) || orgs[0];
        if (userMatch && userMatch.company_name) {
          setExhibitorName(userMatch.company_name);
          setStandName(userMatch.assigned_stand || 'Stand Unassigned');
          return;
        }
      }
    } catch (e) {}

    if (branding?.company_name) {
      setExhibitorName(branding.company_name);
      setStandName('Stand Assigned');
    } else if (isDemoMode) {
      setExhibitorName('Alpha Technology Group');
      setStandName('Stand H3-B24');
    } else {
      setExhibitorName('');
      setStandName('');
    }
  };

  useEffect(() => {
    resolveExhibitor(activeEvent?.id);
  }, [user, branding, isDemoMode, activeEvent?.id]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        let deletedIds = new Set<string>();
        if (typeof window !== 'undefined') {
          try {
            const rawDel = localStorage.getItem('lead2b_deleted_event_ids');
            if (rawDel) deletedIds = new Set(JSON.parse(rawDel));
          } catch (e) {}
        }

        let storedList: Event[] = [];
        let hasStored = false;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('lead2b_events');
          if (stored) {
            hasStored = true;
            try {
              storedList = JSON.parse(stored);
            } catch (e) {}
          }
        }

        let serverList: Event[] = [];
        if (typeof navigator === 'undefined' || navigator.onLine) {
          const { data: dbEvents } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false });
          if (dbEvents && dbEvents.length > 0) {
            serverList = dbEvents as Event[];
          }
        }

        const seen = new Set<string>();
        const merged: Event[] = [];
        const baseList = isDemoMode
          ? (hasStored || serverList.length > 0 ? [...serverList, ...storedList] : [...serverList, ...storedList, ...INITIAL_EVENTS])
          : [...serverList, ...storedList];

        for (const e of baseList) {
          if (!seen.has(e.id) && !deletedIds.has(e.id)) {
            seen.add(e.id);
            merged.push(e);
          }
        }
        setEvents(merged);

        // Check if an active event was selected
        const savedEventId = typeof window !== 'undefined' ? localStorage.getItem('lead2b_active_event_id') : null;
        const matched = merged.find((e) => e.id === savedEventId) || merged[0];
        setActiveEvent(matched || null);
      } catch (err) {
        console.warn('Error loading header events:', err);
      }
    };

    loadEvents();

    const handleEventChange = (e: any) => {
      if (e.detail) {
        setActiveEvent(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('lead2b_event_changed', handleEventChange);
      return () => {
        window.removeEventListener('lead2b_event_changed', handleEventChange);
      };
    }
  }, [isDemoMode]);

  const handleSelectEvent = (eventId: string) => {
    const found = events.find((e) => e.id === eventId);
    if (found) {
      setActiveEvent(found);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lead2b_active_event_id', found.id);
        window.dispatchEvent(new CustomEvent('lead2b_event_changed', { detail: found }));
      }
    }
  };

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

            {/* Dynamic Event or Exhibitor Identity Badge */}
            {type === 'admin' ? (
              <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-200">
                {events.length > 1 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Event:</span>
                    <select
                      value={activeEvent?.id || ''}
                      onChange={(e) => handleSelectEvent(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-brand-500"
                    >
                      {events.map((evt) => (
                        <option key={evt.id} value={evt.id}>
                          {evt.event_name} ({evt.event_code})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {activeEvent?.event_name || 'Active Event'}
                    </span>
                    <span className="text-[10px] bg-brand-50 text-brand-700 font-mono font-semibold px-2 py-0.5 rounded border border-brand-200/80">
                      {activeEvent?.event_code || 'EVENT'}
                    </span>
                  </div>
                )}
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200">
                  Organizer Admin
                </span>
              </div>
            ) : (
              <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-200">
                {exhibitorName && (
                  <span className="text-xs font-bold text-slate-700">
                    {exhibitorName}
                  </span>
                )}
                <span className="text-[10px] bg-slate-100 text-slate-600 font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                  {user?.booth_number ? `Stand ${user.booth_number}` : (isDemoMode ? (standName || 'Stand H3-B24') : 'No Stand')}
                </span>
              </div>
            )}
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
                    title="Switch to Exhibitor Operations Portal"
                  >
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">Exhibitor Portal</span>
                    <span className="sm:hidden">Exhibitor</span>
                  </Link>
                )}
              </div>
            )}

            {/* Direct Switch to Mobile Sales App */}
            <Link
              href="/app/dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-xs"
              title="Launch Mobile Lead Capture Interface"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Sales Terminal</span>
              <span className="sm:hidden">App</span>
            </Link>

            {/* User Profile Initial & Sign Out */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <div
                className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700"
                title={user?.email}
              >
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Button (<1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-100 space-y-1 animate-in fade-in duration-150">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                    isActive
                      ? 'bg-brand-50 text-brand-900 border border-brand-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
