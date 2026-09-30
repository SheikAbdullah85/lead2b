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
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { Lead } from '@/lib/types';

export default function MobileDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [hotCount, setHotCount] = useState(0);
  const [warmCount, setWarmCount] = useState(0);
  const [followupCount, setFollowupCount] = useState(2);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const localList = await localDb.leads.toArray();
        if (localList.length > 0) {
          const ids = new Set(localList.map((l) => l.id));
          const merged = [...localList, ...INITIAL_LEADS.filter((l) => !ids.has(l.id))];
          setLeads(merged);
        } else {
          setLeads(INITIAL_LEADS);
        }
      } catch (err) {
        setLeads(INITIAL_LEADS);
      }
    };

    loadLeads();
  }, []);

  useEffect(() => {
    const hot = leads.filter((l) => l.rating === 'hot').length;
    const warm = leads.filter((l) => l.rating === 'warm').length;
    setHotCount(hot);
    setWarmCount(warm);
  }, [leads]);

  // Gamified Booth Staff Leaderboard Aggregation
  const repLeaderboard = useMemo(() => {
    const map: Record<string, { name: string; count: number; hot: number }> = {
      'Tariq Mansoor': { name: 'Tariq Mansoor', count: 0, hot: 0 },
      'Fatima Al Zaabi': { name: 'Fatima Al Zaabi', count: 14, hot: 6 },
      'David Miller': { name: 'David Miller', count: 11, hot: 4 },
      'Marcus Vance': { name: 'Marcus Vance', count: 7, hot: 2 },
    };

    leads.forEach((l) => {
      const rep = l.captured_by_name || 'Tariq Mansoor';
      if (!map[rep]) {
        map[rep] = { name: rep, count: 0, hot: 0 };
      }
      map[rep].count += 1;
      if (l.rating === 'hot') map[rep].hot += 1;
    });

    const medals = ['🥇', '🥈', '🥉', '4th'];
    const badges = ['Top Closer 🔥', 'VIP Hunter 🎯', 'Speed Demon ⚡', 'Active Rep ⭐'];

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .map((r, idx) => ({
        ...r,
        rank: idx + 1,
        medal: medals[idx] || `${idx + 1}th`,
        badge: badges[idx] || 'Booth Rep',
      }));
  }, [leads]);

  const hourlyVelocity = Math.max(16, Math.round(leads.length * 1.8));
  const hourlyTarget = 25;
  const isAheadOfTarget = hourlyVelocity >= hourlyTarget;

  return (
    <div className="space-y-4">
      {/* Event Header Banner */}
      <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#004d53] text-white shadow-lg border border-teal-900/40">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00838f]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#22d3ee] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse"></span>
              Live Exhibition
            </span>
            <h2 className="text-lg font-black tracking-tight mt-0.5 text-white">GITEX Global 2026</h2>
            <p className="text-xs text-slate-300 font-medium">Dubai World Trade Centre</p>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-white/10 text-cyan-200 border border-white/20 backdrop-blur-md">
              Day 1 • Stand H3-B24
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid matching prompt specifications */}
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

      {/* Primary Action Button (SCAN VISITOR LEAD) */}
      <Link href="/app/scan" prefetch={true} className="block">
        <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#006d77] via-[#00838f] to-[#0891b2] text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-teal-700/35 hover:shadow-teal-700/55 active:scale-[0.98] transition-all cursor-pointer border border-teal-400/30">
          <QrCode className="w-7 h-7 text-cyan-200 animate-pulse stroke-[2.4]" />
          <span className="tracking-wide">SCAN VISITOR LEAD</span>
        </button>
      </Link>

      {/* Secondary Actions: Business Card & Manual Lead */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/app/lead/card" prefetch={true} className="block">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:bg-teal-50/20 active:scale-[0.98] transition flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-[#00838f] border border-teal-200/70">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">Business Card</p>
              <p className="text-[10px] text-slate-400 mt-1">Photo & Auto-Size</p>
            </div>
          </div>
        </Link>

        <Link href="/app/lead/new" prefetch={true} className="block">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-teal-400 hover:bg-teal-50/20 active:scale-[0.98] transition flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900 leading-none">Manual Lead</p>
              <p className="text-[10px] text-slate-400 mt-1">Form Entry</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Booth Velocity & Target HUD */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white shadow-md border border-slate-700/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Booth Velocity &amp; Target Pace</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
            {isAheadOfTarget ? '▲ 18% Ahead of Quota' : 'On Track'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-slate-400 text-[11px]">Capture Pace (Rolling Velocity)</span>
          <span className="font-black text-cyan-300">
            {hourlyVelocity} leads/hr <span className="text-slate-400 font-normal">/ {hourlyTarget} target</span>
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((hourlyVelocity / hourlyTarget) * 100))}%` }}
          />
        </div>
      </div>

      {/* Gamified Live Booth Staff Leaderboard */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Live Booth Staff Leaderboard</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Stand H3-B24
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

      {/* Recent Leads Feed */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-black text-slate-700 uppercase tracking-wider px-1">
          <span>Recent Captured Leads</span>
          <Link href="/app/leads" prefetch={true} className="text-[#00838f] hover:underline normal-case font-bold flex items-center gap-0.5">
            <span>View All ({leads.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {leads.slice(0, 4).map((lead) => (
            <Link key={lead.id} href={`/app/lead/${lead.id}`} className="block">
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-[#00838f] transition flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-300/60 shadow-2xs">
                    {lead.first_name[0]}{lead.last_name[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-none">
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
          ))}
        </div>
      </div>
    </div>
  );
}
