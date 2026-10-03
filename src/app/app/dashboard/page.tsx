'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  QrCode,
  CreditCard,
  UserPlus,
  Flame,
  Sun,
  CalendarCheck,
  Clock,
  ChevronRight,
  Sparkles,
  Building2,
  User,
  ArrowUpRight,
  Trophy,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { localDb } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { Lead } from '@/lib/types';
import { useAuth } from '@/lib/auth/context';
import { getActiveEvent, getActiveTenant, ActiveEventInfo, ActiveTenantInfo } from '@/lib/events/active-event';

export default function MobileDashboardPage() {
  const { user, isDemoMode } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [hotCount, setHotCount] = useState(0);
  const [warmCount, setWarmCount] = useState(0);
  const [followupCount, setFollowupCount] = useState(0);

  const [activeEvent, setActiveEvent] = useState<ActiveEventInfo>(getActiveEvent());
  const [activeTenant, setActiveTenant] = useState<ActiveTenantInfo>(getActiveTenant());

  useEffect(() => {
    const handleSync = () => {
      setActiveEvent(getActiveEvent());
      setActiveTenant(getActiveTenant());
    };
    handleSync();
    if (typeof window !== 'undefined') {
      window.addEventListener('lead2b_event_changed', handleSync);
      return () => window.removeEventListener('lead2b_event_changed', handleSync);
    }
  }, []);

  const loadLeads = async () => {
    try {
      const localList = await localDb.leads.toArray().catch(() => []);
      let serverList: Lead[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const { data: dbLeads } = await supabase.from('leads').select('*').limit(100);
        if (dbLeads) serverList = dbLeads as Lead[];
      }
      const seenIds = new Set<string>();
      const merged: Lead[] = [];
      for (const l of [...localList, ...serverList]) {
        if (!seenIds.has(l.id)) {
          seenIds.add(l.id);
          merged.push(l as Lead);
        }
      }

      // In demo mode only, fallback to INITIAL_LEADS if completely empty
      let combined = merged;
      if (isDemoMode && combined.length === 0) {
        combined = [...INITIAL_LEADS];
      }

      combined.sort((a, b) => {
        const tA = new Date(a.created_at || a.captured_at || 0).getTime();
        const tB = new Date(b.created_at || b.captured_at || 0).getTime();
        return tB - tA;
      });
      setLeads(combined);

      // Load tasks count
      const localTasks = await localDb.followups.toArray().catch(() => []);
      setFollowupCount(localTasks.length);
    } catch (err) {
      setLeads([]);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [isDemoMode]);

  useEffect(() => {
    const hot = leads.filter((l) => l.rating === 'hot').length;
    const warm = leads.filter((l) => l.rating === 'warm').length;
    setHotCount(hot);
    setWarmCount(warm);
  }, [leads]);

  // Gamified Booth Staff Leaderboard Aggregation - Strictly Real Data
  const repLeaderboard = useMemo(() => {
    const map: Record<string, { name: string; count: number; hot: number }> = {};

    if (leads.length === 0) {
      const activeName = user?.full_name || 'Sheik Abdullah';
      map[activeName] = { name: activeName, count: 0, hot: 0 };
    } else {
      leads.forEach((l) => {
        const rep = l.captured_by_name || user?.full_name || 'Sheik Abdullah';
        if (!map[rep]) {
          map[rep] = { name: rep, count: 0, hot: 0 };
        }
        map[rep].count += 1;
        if (l.rating === 'hot') map[rep].hot += 1;
      });
    }

    const medals = ['🥇', '🥈', '🥉', '4th'];
    const badges = ['Top Closer 🔥', 'VIP Hunter 🎯', 'Speed Demon ⚡', 'Active Rep ⭐'];

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .map((r, idx) => ({
        ...r,
        rank: idx + 1,
        medal: medals[idx] || `${idx + 1}th`,
        badge: r.count > 0 ? (badges[idx] || 'Booth Rep') : 'Ready to Capture ✨',
      }));
  }, [leads, user]);

  const standDisplay = user?.booth_number ? `Stand ${user.booth_number}` : (activeTenant.stand || 'Stand TK-01');

  return (
    <div className="space-y-4">
      {/* Event Header Banner */}
      <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#004d53] text-white shadow-lg border border-teal-900/40">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00838f]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"></span>
              Live Exhibition
            </span>
            <h2 className="text-lg font-black tracking-tight mt-0.5 text-white">{activeEvent.name}</h2>
            <p className="text-xs text-slate-300 font-medium">{activeEvent.venue}, {activeEvent.city}</p>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-white/10 text-cyan-200 border border-white/20 backdrop-blur-md">
              Day 1 • {standDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 block">
            Today
          </span>
          <span className="text-2xl font-black text-slate-900 leading-tight">
            {leads.length}
          </span>
          <span className="text-[9px] text-slate-400 block font-medium">Captures</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-rose-700 block flex items-center justify-center gap-0.5">
            <Flame className="w-3 h-3 text-rose-600 animate-pulse" /> Hot
          </span>
          <span className="text-2xl font-black text-rose-700 leading-tight">
            {hotCount}
          </span>
          <span className="text-[9px] text-rose-600 block font-medium">Immediate</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-amber-800 block flex items-center justify-center gap-0.5">
            <Sun className="w-3 h-3 text-amber-600" /> Warm
          </span>
          <span className="text-2xl font-black text-amber-800 leading-tight">
            {warmCount}
          </span>
          <span className="text-[9px] text-amber-700 block font-medium">1-3 mo</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-center shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-teal-800 block flex items-center justify-center gap-0.5">
            <CalendarCheck className="w-3 h-3 text-teal-600" /> Tasks
          </span>
          <span className="text-2xl font-black text-teal-800 leading-tight">
            {followupCount}
          </span>
          <span className="text-[9px] text-teal-700 block font-medium">Due</span>
        </div>
      </div>

      {/* 3 Primary Lead Capture Hero Actions without numbering counts */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
            Quick Capture Actions
          </span>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            100% Offline Ready
          </span>
        </div>

        {/* Action 1: SCAN BADGE (Camera QR + Badge OCR) */}
        <Link href="/app/scan" prefetch={true} className="block group">
          <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#005f69] via-[#00838f] to-[#0891b2] text-white shadow-lg shadow-teal-900/20 hover:shadow-xl hover:shadow-teal-800/30 active:scale-[0.98] transition-all cursor-pointer border border-teal-400/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25 shadow-inner">
                <QrCode className="w-6 h-6 text-cyan-200 stroke-[2.4]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black tracking-tight text-white leading-tight">
                    SCAN BADGE
                  </h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-cyan-100 border border-white/25">
                    QR &amp; OCR
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 truncate font-medium">
                  Camera QR scanner &amp; physical badge photo OCR
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition">
              <ChevronRight className="w-5 h-5 text-cyan-200" />
            </div>
          </div>
        </Link>

        {/* Action 2: BUSINESS CARD SCANNER */}
        <Link href="/app/lead/card" prefetch={true} className="block group">
          <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/90 shadow-2xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-600">
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    BUSINESS CARD SCAN
                  </h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    AI OCR
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                  Snap paper cards • Instant contact parsing
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition">
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
            </div>
          </div>
        </Link>

        {/* Action 3: MANUAL LEAD ENTRY */}
        <Link href="/app/lead/new" prefetch={true} className="block group">
          <div className="w-full p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/90 shadow-2xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/60 flex items-center justify-center shrink-0 text-brand-700">
                <UserPlus className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    MANUAL LEAD ENTRY
                  </h3>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    FORM
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                  Type or voice dictate full lead details
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition">
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
            </div>
          </div>
        </Link>
      </div>

      {/* Real-time Captured Leads Feed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Recent Leads Feed
            </h3>
          </div>
          <Link
            href="/app/leads"
            className="text-[11px] font-bold text-[#00838f] hover:text-[#006d77] transition flex items-center gap-0.5"
          >
            <span>View All ({leads.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {leads.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
              <div className="w-10 h-10 rounded-full bg-teal-50 text-[#00838f] flex items-center justify-center mx-auto">
                <QrCode className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No leads captured yet</p>
              <p className="text-[11px] text-slate-400">
                Tap &quot;SCAN BADGE&quot; or &quot;MANUAL LEAD ENTRY&quot; above to capture your first visitor!
              </p>
            </div>
          ) : (
            leads.slice(0, 4).map((lead) => (
              <Link
                key={lead.id}
                href={`/app/lead/${lead.id}`}
                className="block p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm active:scale-[0.99] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 font-black text-slate-700 flex items-center justify-center text-xs shrink-0 border border-slate-200/80">
                      {lead.first_name ? lead.first_name[0] : 'L'}
                      {lead.last_name ? lead.last_name[0] : ''}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900 truncate">
                          {lead.first_name} {lead.last_name}
                        </h4>
                        <Badge variant={lead.rating as any} size="sm">
                          {lead.rating.toUpperCase()}
                        </Badge>
                      </div>

                      <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{lead.company || 'Enterprise'}</span>
                      </p>

                      <p className="text-[10px] text-[#00838f] font-semibold mt-0.5">
                        {lead.product_interest || 'Enterprise Solution'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={lead.sync_status === 'synced' ? 'synced' : 'pending'}>
                      {lead.sync_status === 'synced' ? 'Synced' : 'Offline'}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(lead.created_at || lead.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Gamified Live Booth Staff Leaderboard - AS THE LAST CARD */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Live Booth Staff Leaderboard</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {standDisplay}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {repLeaderboard.map((rep) => (
            <div key={rep.name} className="py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base shrink-0">{rep.medal}</span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{rep.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {rep.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {rep.hot} Hot Lead{rep.hot === 1 ? '' : 's'} Qualified
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-black text-brand-700 block leading-tight">
                  {rep.count}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">
                  Scans
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
