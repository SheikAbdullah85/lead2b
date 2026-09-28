'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, Building2, Users, QrCode, TrendingUp, Shield, Activity, Plus } from 'lucide-react';

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
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            System & Event Administration
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Organizer Control Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-event telemetry, exhibitor adoption metrics, attendee imports, and license quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/attendees">
            <Button size="sm" variant="outline" className="text-xs font-semibold gap-1.5 bg-white">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Import Attendees (Excel)</span>
            </Button>
          </Link>
          <Link href="/admin/events">
            <Button size="sm" variant="primary" className="text-xs font-bold gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Exhibitions</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{organizerStats.eventsCount}</div>
            <p className="text-xs text-slate-500 mt-1">GITEX Global 2026 active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader className="pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Exhibitors</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-indigo-700">
              {organizerStats.activeExhibitors} / {organizerStats.totalExhibitors}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              {organizerStats.adoptionRate} adoption rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads Captured</span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">
              {organizerStats.totalLeadsCaptured.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">
              +{organizerStats.leadsToday.toLocaleString()} today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
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
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Exhibitor Lead Capture Adoption</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Aggregated booth metrics without exposing confidential lead details</p>
          </div>
          <Link href="/admin/exhibitors" className="text-xs font-bold text-blue-600 hover:underline">
            Manage All Exhibitors →
          </Link>
        </CardHeader>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Exhibitor Company</th>
              <th className="p-3">Assigned Booth</th>
              <th className="p-3">Active Sales Reps</th>
              <th className="p-3">Total Leads Captured</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exhibitorRankings.map((ex) => (
              <tr key={ex.name} className="hover:bg-slate-50/80 transition">
                <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>{ex.name}</span>
                </td>
                <td className="p-3 font-mono font-semibold text-slate-600">{ex.booth}</td>
                <td className="p-3 text-slate-600">{ex.reps} representatives</td>
                <td className="p-3 font-black text-blue-600 text-sm">{ex.leads} leads</td>
                <td className="p-3">
                  <Badge variant="synced">{ex.status}</Badge>
                </td>
                <td className="p-3 text-right">
                  <button className="text-xs font-semibold text-blue-600 hover:underline">
                    View Booth Stats
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
