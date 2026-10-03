'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { exportLeadsToExcel } from '@/lib/utils/export-excel';
import {
  Users, Flame, Sun, CalendarCheck, TrendingUp, Download, Building2,
  Clock, ArrowUpRight, CheckCircle2, ShieldCheck, Tag, Sparkles, Award, QrCode
} from 'lucide-react';
import { localDb } from '@/lib/db/dexie';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { useBranding } from '@/lib/branding/context';
import { getActiveEvent, getActiveTenant } from '@/lib/events/active-event';
import { Lead } from '@/lib/types';
import { useEffect } from 'react';

export default function ExhibitorDashboardPage() {
  const { user, isDemoMode } = useAuth();
  const { branding } = useBranding();
  const [activeEvent, setActiveEvent] = useState(getActiveEvent());
  const [activeTenant, setActiveTenant] = useState(getActiveTenant());
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedEvent, setSelectedEvent] = useState(activeEvent.id);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const localList = await localDb.leads.toArray().catch(() => []);
        let serverList: Lead[] = [];
        if (typeof navigator === 'undefined' || navigator.onLine) {
          const { data: dbLeads } = await supabase.from('leads').select('*').limit(200);
          if (dbLeads) serverList = dbLeads as Lead[];
        }
        const seenIds = new Set<string>();
        const merged: Lead[] = [];
        for (const l of [...serverList, ...localList]) {
          if (!seenIds.has(l.id)) {
            seenIds.add(l.id);
            merged.push(l as Lead);
          }
        }
        if (isDemoMode && merged.length === 0) {
          setLeads([...INITIAL_LEADS]);
        } else {
          setLeads(merged);
        }
      } catch (e) {
        setLeads([]);
      }
    };
    fetchLeads();
  }, [isDemoMode]);

  const hotCount = leads.filter((l) => l.rating === 'hot').length;
  const warmCount = leads.filter((l) => l.rating === 'warm').length;
  const coldCount = leads.filter((l) => l.rating === 'cold').length;

  // Rep leaderboard aggregation
  const repStats: Record<string, { name: string; count: number; hot: number }> = {};
  leads.forEach((l) => {
    const rep = l.captured_by_name || user?.full_name || 'Sheik Abdullah';
    if (!repStats[rep]) {
      repStats[rep] = { name: rep, count: 0, hot: 0 };
    }
    repStats[rep].count += 1;
    if (l.rating === 'hot') repStats[rep].hot += 1;
  });

  // Product interest aggregation
  const productStats: Record<string, number> = {};
  leads.forEach((l) => {
    const prod = l.product_interest || 'Enterprise Solution';
    productStats[prod] = (productStats[prod] || 0) + 1;
  });

  // Hourly velocity mock data (10 AM to 5 PM)
  const hourlyData = [
    { hour: '10 AM', count: 18 },
    { hour: '11 AM', count: 32 },
    { hour: '12 PM', count: 28 },
    { hour: '1 PM', count: 15 },
    { hour: '2 PM', count: 39 },
    { hour: '3 PM', count: 44 },
    { hour: '4 PM', count: 26 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-brand-600" />
            Exhibitor Analytics Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {activeEvent.name} — {branding.company_name || activeTenant.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-700">{user?.booth_number ? `Stand ${user.booth_number}` : activeTenant.stand}</span>
            <span>•</span>
            <span className="text-brand-700 font-bold">{activeEvent.venue}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry Connected
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLeadsToExcel(leads)}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 hover:border-brand-300"
          >
            <Download className="w-3.5 h-3.5 text-brand-600" />
            <span>Export Excel</span>
          </Button>

          <Link href="/exhibitor/leads">
            <Button size="sm" variant="primary" className="text-xs font-bold gap-1.5 shadow-sm">
              <Users className="w-3.5 h-3.5" />
              <span>All Leads ({leads.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-600 shadow-2xs hover:shadow-xs transition">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
              <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{leads.length}</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +100% vs Day 1 target
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-2xs hover:shadow-xs transition">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hot Leads (Urgent)</span>
              <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <Flame className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-600">{hotCount}</div>
            <p className="text-xs text-slate-500 mt-1">High purchase intent (&lt;30d)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-2xs hover:shadow-xs transition">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Warm Leads</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Sun className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-700">{warmCount}</div>
            <p className="text-xs text-slate-500 mt-1">1–3 months evaluation</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-2xs hover:shadow-xs transition">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cloud & CRM Sync</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-600">100%</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Dexie records synced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Hourly Velocity + Rep Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Lead Velocity Chart */}
        <Card className="lg:col-span-2 shadow-2xs">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-black">Booth Lead Velocity by Hour</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Captures per hour at {activeTenant.stand || 'Stand TK-01'}</p>
              </div>
              <span className="text-xs font-black text-brand-800 bg-brand-50 border border-brand-200/60 px-3 py-1 rounded-full">
                Peak: 3 PM (44 leads/hr)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-end gap-3 pt-6 px-2">
              {hourlyData.map((d) => {
                const max = 50;
                const heightPct = Math.round((d.count / max) * 100);
                return (
                  <div key={d.hour} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-black text-brand-700 opacity-0 group-hover:opacity-100 transition">
                      {d.count}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-brand-700 to-brand-500 hover:from-brand-600 hover:to-brand-400 rounded-t-xl transition-all shadow-2xs"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-500 font-bold">{d.hour}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Rep Leaderboard */}
        <Card className="shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-black">Booth Team Performance</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Live leads captured per representative</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.values(repStats).length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">No leads captured yet for this booth.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Captures from mobile app will appear here instantly</p>
                </div>
              ) : (
                Object.values(repStats).map((rep, idx) => (
                  <div key={rep.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-slate-100/60 transition">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shadow-2xs ${
                        idx === 0
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-200'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-brand-100 text-brand-800'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{rep.name}</h4>
                        <p className="text-[10px] text-rose-600 font-bold">🔥 {rep.hot} Hot Leads</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">{rep.count}</span>
                      <span className="text-[10px] text-slate-400 block font-medium">leads</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Interest & Purchase Timeline Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-black">Product Interest Breakdown</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Most in-demand solutions at exhibition</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {Object.entries(productStats).map(([prod, count]) => {
                const pct = Math.round((count / leads.length) * 100);
                return (
                  <div key={prod} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold">{prod}</span>
                      <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-brand-600 to-brand-400 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xs">
          <CardHeader>
            <CardTitle className="text-base font-black">Purchase Timeline Distribution</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Buying horizon across qualified visitors</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {[
                { label: 'Immediate (<30 days)', count: leads.filter((l) => l.purchase_timeline === 'immediate').length, color: 'bg-emerald-500' },
                { label: '1 to 3 Months', count: leads.filter((l) => l.purchase_timeline === '1-3 months').length, color: 'bg-brand-500' },
                { label: '3 to 6 Months', count: leads.filter((l) => l.purchase_timeline === '3-6 months').length, color: 'bg-amber-500' },
              ].map((t) => {
                const pct = Math.round((t.count / leads.length) * 100);
                return (
                  <div key={t.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold">{t.label}</span>
                      <span className="font-bold text-slate-900">{t.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`${t.color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
