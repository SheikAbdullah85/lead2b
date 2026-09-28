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
  Clock, ArrowUpRight, CheckCircle2, ShieldCheck, Tag
} from 'lucide-react';

export default function ExhibitorDashboardPage() {
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [selectedEvent, setSelectedEvent] = useState('eeee1111-1111-1111-1111-111111111111');

  const hotCount = leads.filter((l) => l.rating === 'hot').length;
  const warmCount = leads.filter((l) => l.rating === 'warm').length;
  const coldCount = leads.filter((l) => l.rating === 'cold').length;

  // Rep leaderboard aggregation
  const repStats: Record<string, { name: string; count: number; hot: number }> = {};
  leads.forEach((l) => {
    const rep = l.captured_by_name || 'Tariq Mansoor';
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
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Exhibitor Analytics Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            GITEX Global 2026 — Alpha Technology Group
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hall 3, Stand H3-B24 • Real-time booth performance & team activity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLeadsToExcel(leads)}
            className="text-xs font-semibold gap-1.5 bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </Button>

          <Link href="/exhibitor/leads">
            <Button size="sm" variant="primary" className="text-xs font-bold gap-1.5 shadow-xs">
              <Users className="w-3.5 h-3.5" />
              <span>View All Leads ({leads.length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Headline Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{leads.length}</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +100% vs Day 1 target
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hot Leads (Urgent)</span>
              <Flame className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-700">{hotCount}</div>
            <p className="text-xs text-slate-400 mt-1">Immediate follow-up needed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Warm Leads</span>
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-800">{warmCount}</div>
            <p className="text-xs text-slate-400 mt-1">1–3 months evaluation</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cloud & CRM Sync</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">100%</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> All records synchronized
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Hourly Velocity + Rep Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Lead Velocity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Booth Lead Velocity by Hour</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Captures per hour at GITEX Hall 3</p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Peak: 3 PM (44 leads)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-3 pt-6 px-2">
              {hourlyData.map((d) => {
                const max = 50;
                const heightPct = Math.round((d.count / max) * 100);
                return (
                  <div key={d.hour} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition">
                      {d.count}
                    </span>
                    <div
                      className="w-full bg-blue-600 hover:bg-blue-500 rounded-t-lg transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] font-mono text-slate-400">{d.hour}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Rep Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Booth Team Performance</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Leads captured per representative</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.values(repStats).map((rep, idx) => (
                <div key={rep.name} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rep.name}</h4>
                      <p className="text-[10px] text-slate-400">🔥 {rep.hot} Hot Leads</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">{rep.count}</span>
                    <span className="text-[10px] text-slate-400 block">leads</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Interest & Purchase Timeline Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Interest Breakdown</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Most in-demand solutions at exhibition</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(productStats).map(([prod, count]) => {
                const pct = Math.round((count / leads.length) * 100);
                return (
                  <div key={prod} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{prod}</span>
                      <span className="font-bold text-slate-900">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Timeline Distribution</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Buying horizon across qualified visitors</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Immediate (<30 days)', count: leads.filter((l) => l.purchase_timeline === 'immediate').length },
                { label: '1 to 3 Months', count: leads.filter((l) => l.purchase_timeline === '1-3 months').length },
                { label: '3 to 6 Months', count: leads.filter((l) => l.purchase_timeline === '3-6 months').length },
              ].map((t) => {
                const pct = Math.round((t.count / leads.length) * 100);
                return (
                  <div key={t.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{t.label}</span>
                      <span className="font-bold text-slate-900">{t.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct}%` }} />
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
