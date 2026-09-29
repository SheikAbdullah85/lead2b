'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Building2, Users, QrCode, TrendingUp, Shield, Activity, Plus, Sparkles, ShieldCheck } from 'lucide-react';

export default function AdminDashboardPage() {
  const organizerStats = {
    eventsCount: 2,
    totalExhibitors: 12,
    activeExhibitors: 10,
    activeUsers: 84,
    totalLeadsCaptured: 14820,
    leadsToday: 4230,
    adoptionRate: '94.2%',
  };

  const exhibitorRankings = [
    { name: 'Alpha Technology Group', booth: 'H3-B24', leads: 480, reps: 5, status: 'Active' },
    { name: 'Beta Solutions Corp', booth: 'H6-A12', leads: 390, reps: 4, status: 'Active' },
    { name: 'Emirates Telecom Solutions', booth: 'H1-C04', leads: 620, reps: 8, status: 'Active' },
    { name: 'Gulf Cybersecurity Systems', booth: 'H2-D11', leads: 310, reps: 3, status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3 h-3 text-brand-600" />
            Organizer Command Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">System & Event Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-event telemetry, exhibitor license quotas, badge imports, and tenant health monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/attendees">
            <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5 bg-white border-slate-200 hover:border-brand-300">
              <Users className="w-3.5 h-3.5 text-brand-600" />
              <span>Import Badges (Excel)</span>
            </Button>
          </Link>
          <Link href="/admin/events">
            <Button size="sm" variant="primary" className="text-xs font-bold gap-1.5 shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-600 shadow-2xs">
          <CardHeader className="pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Exhibitions</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{organizerStats.eventsCount}</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">GITEX Global 2026 active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-brand-700 shadow-2xs">
          <CardHeader className="pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Exhibitors</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-brand-900">
              {organizerStats.activeExhibitors} / {organizerStats.totalExhibitors}
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-1">
              {organizerStats.adoptionRate} adoption rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-2xs">
          <CardHeader className="pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads Captured</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">
              {organizerStats.totalLeadsCaptured.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 font-bold mt-1">
              +{organizerStats.leadsToday.toLocaleString()} captured today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-2xs">
          <CardHeader className="pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Rep Users</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-700">{organizerStats.activeUsers}</div>
            <p className="text-xs text-slate-400 mt-1">Across 12 exhibition stands</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Exhibitor Activity Rankings */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <CardHeader className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base font-black">Exhibitor Lead Capture Adoption</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated booth metrics without exposing confidential lead details</p>
          </div>
          <Link href="/admin/exhibitors" className="text-xs font-bold text-brand-700 hover:text-brand-900">
            Manage All Exhibitors →
          </Link>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Exhibitor Company</th>
                <th className="p-3.5">Assigned Stand</th>
                <th className="p-3.5">Active Sales Reps</th>
                <th className="p-3.5">Total Leads Captured</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exhibitorRankings.map((ex) => (
                <tr key={ex.name} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>{ex.name}</span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-700">{ex.booth}</td>
                  <td className="p-3.5 text-slate-600 font-medium">{ex.reps} representatives</td>
                  <td className="p-3.5 font-black text-brand-700 text-sm">{ex.leads} leads</td>
                  <td className="p-3.5">
                    <Badge variant="synced">{ex.status}</Badge>
                  </td>
                  <td className="p-3.5 text-right">
                    <button className="text-xs font-bold text-brand-700 hover:text-brand-900">
                      View Booth Stats
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
