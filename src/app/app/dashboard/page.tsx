'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QrCode, CreditCard, UserPlus, Flame, Sun, CalendarCheck, Clock, ChevronRight, Sparkles, Building2, User } from 'lucide-react';
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
    // Load local Dexie leads merged with mock leads
    const loadLeads = async () => {
      try {
        const localList = await localDb.leads.toArray();
        if (localList.length > 0) {
          // Merge avoiding duplicates by id
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

  return (
    <div className="space-y-4">
      {/* Event Header Banner */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
            Current Exhibition
          </span>
          <h2 className="text-base font-black">GITEX Global 2026</h2>
          <p className="text-xs text-slate-300">Dubai World Trade Centre</p>
        </div>
        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Day 1 of 5
          </span>
        </div>
      </div>

      {/* KPI Stats Grid matching prompt specifications */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400 block">
            Today
          </span>
          <span className="text-xl font-black text-slate-900 leading-tight">
            {leads.length}
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Leads</span>
        </div>

        <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-red-600 block flex items-center justify-center gap-0.5">
            <Flame className="w-3 h-3 text-red-500" /> Hot
          </span>
          <span className="text-xl font-black text-red-700 leading-tight">
            {hotCount}
          </span>
          <span className="text-[9px] text-red-500 block mt-0.5">Urgent</span>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-amber-700 block flex items-center justify-center gap-0.5">
            <Sun className="w-3 h-3 text-amber-500" /> Warm
          </span>
          <span className="text-xl font-black text-amber-800 leading-tight">
            {warmCount}
          </span>
          <span className="text-[9px] text-amber-600 block mt-0.5">Active</span>
        </div>

        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-tight text-blue-700 block flex items-center justify-center gap-0.5">
            <CalendarCheck className="w-3 h-3 text-blue-500" /> Tasks
          </span>
          <span className="text-xl font-black text-blue-800 leading-tight">
            {followupCount}
          </span>
          <span className="text-[9px] text-blue-600 block mt-0.5">Follow-ups</span>
        </div>
      </div>

      {/* Primary Action Button (SCAN LEAD) */}
      <Link href="/app/scan" className="block">
        <button className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 active:scale-[0.98] transition-all">
          <QrCode className="w-7 h-7 text-sky-200 animate-pulse" />
          <span>SCAN VISITOR LEAD</span>
        </button>
      </Link>

      {/* Secondary Actions: Business Card & Manual Lead */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/app/lead/card" className="block">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">Business Card</p>
              <p className="text-[10px] text-slate-400 mt-1">Photo & Capture</p>
            </div>
          </div>
        </Link>

        <Link href="/app/lead/new" className="block">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">Manual Lead</p>
              <p className="text-[10px] text-slate-400 mt-1">Form Entry</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Leads Feed */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          <span>Recent Captured Leads</span>
          <Link href="/app/leads" className="text-blue-600 hover:underline normal-case font-semibold">
            View All ({leads.length})
          </Link>
        </div>

        <div className="space-y-2">
          {leads.slice(0, 4).map((lead) => (
            <Link key={lead.id} href={`/app/lead/${lead.id}`} className="block">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 mt-0.5">
                    {lead.first_name[0]}{lead.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 leading-none">
                        {lead.first_name} {lead.last_name}
                      </h4>
                      <Badge variant={lead.rating as any} size="sm">
                        {lead.rating.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{lead.company || 'Enterprise'}</span>
                    </p>
                    <p className="text-[10px] text-blue-600 font-medium">
                      {lead.product_interest || 'Enterprise Solution'}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <Badge variant={lead.sync_status === 'synced' ? 'synced' : 'pending'}>
                    {lead.sync_status === 'synced' ? 'Synced' : 'Offline'}
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
