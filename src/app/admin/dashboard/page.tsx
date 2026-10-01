'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar,
  Building2,
  Users,
  QrCode,
  TrendingUp,
  Shield,
  Activity,
  Plus,
  Sparkles,
  ShieldCheck,
  Flame,
  Sun,
  Clock,
  Download,
  Printer,
  CheckCircle2,
  BarChart3,
  Award,
} from 'lucide-react';

interface ExhibitorItem {
  name: string;
  booth: string;
  leads: number;
  reps: number;
  status: string;
}

export default function AdminDashboardPage() {
  const [selectedBooth, setSelectedBooth] = useState<ExhibitorItem | null>(null);

  const organizerStats = {
    eventsCount: 2,
    totalExhibitors: 12,
    activeExhibitors: 10,
    activeUsers: 84,
    totalLeadsCaptured: 14820,
    leadsToday: 4230,
    adoptionRate: '94.2%',
  };

  const exhibitorRankings: ExhibitorItem[] = [
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
                    <button
                      onClick={() => setSelectedBooth(ex)}
                      className="text-xs font-bold text-brand-700 hover:text-brand-900 px-2.5 py-1 rounded-md hover:bg-brand-50 transition"
                    >
                      View Booth Stats
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Booth Stats Modal */}
      {selectedBooth && (
        <Modal
          isOpen={!!selectedBooth}
          onClose={() => setSelectedBooth(null)}
          title={`Booth Telemetry: ${selectedBooth.name}`}
          description={`Stand ${selectedBooth.booth} • Live Operational Metrics & Scan Velocity`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Top KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="text-[11px] font-bold uppercase text-slate-500">Total Leads</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{selectedBooth.leads}</div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">+18% above quota</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="text-[11px] font-bold uppercase text-slate-500">Scan Velocity</div>
                <div className="text-2xl font-black text-brand-700 mt-1">
                  {Math.round(selectedBooth.leads / 16)} / hr
                </div>
                <div className="text-[11px] text-brand-600 font-semibold mt-0.5">Peak: 14:00 - 16:00</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="text-[11px] font-bold uppercase text-slate-500">Active Reps</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{selectedBooth.reps}</div>
                <div className="text-[11px] text-slate-500 font-semibold mt-0.5">100% active today</div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                <div className="text-[11px] font-bold uppercase text-slate-500">Sync Status</div>
                <div className="flex items-center gap-1.5 text-sm font-black text-emerald-700 mt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Real-time</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">0 pending queue</div>
              </div>
            </div>

            {/* Lead Qualification Tier Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-brand-600" />
                  <span>Lead Qualification Quality Breakdown</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {Math.round(selectedBooth.leads * 0.38)} Hot / {Math.round(selectedBooth.leads * 0.45)} Warm
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: '38%' }} className="bg-rose-500" title="Hot Leads: 38%" />
                <div style={{ width: '45%' }} className="bg-amber-400" title="Warm Leads: 45%" />
                <div style={{ width: '17%' }} className="bg-slate-300" title="Cold Leads: 17%" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                  <div className="flex items-center justify-center gap-1 text-rose-700 font-black">
                    <Flame className="w-3.5 h-3.5" />
                    <span>HOT (38%)</span>
                  </div>
                  <div className="text-sm font-black text-rose-900 mt-0.5">
                    {Math.round(selectedBooth.leads * 0.38)} leads
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center justify-center gap-1 text-amber-700 font-black">
                    <Sun className="w-3.5 h-3.5" />
                    <span>WARM (45%)</span>
                  </div>
                  <div className="text-sm font-black text-amber-900 mt-0.5">
                    {Math.round(selectedBooth.leads * 0.45)} leads
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-600 font-bold">COLD (17%)</div>
                  <div className="text-sm font-black text-slate-800 mt-0.5">
                    {Math.round(selectedBooth.leads * 0.17)} leads
                  </div>
                </div>
              </div>
            </div>

            {/* Booth Staff Leaderboard */}
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-600" />
                <span>Top Booth Representatives</span>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Tariq Mansoor', rank: '🥇', leads: Math.round(selectedBooth.leads * 0.36), hot: Math.round(selectedBooth.leads * 0.16), role: 'Senior Solutions Architect' },
                  { name: 'Fatima Al Zaabi', rank: '🥈', leads: Math.round(selectedBooth.leads * 0.30), hot: Math.round(selectedBooth.leads * 0.12), role: 'Key Account Executive' },
                  { name: 'David Miller', rank: '🥉', leads: Math.round(selectedBooth.leads * 0.20), hot: Math.round(selectedBooth.leads * 0.07), role: 'Technical Sales Lead' },
                  { name: 'Marcus Vance', rank: '4th', leads: Math.round(selectedBooth.leads * 0.14), hot: Math.round(selectedBooth.leads * 0.03), role: 'Enterprise Rep' },
                ].map((rep) => (
                  <div key={rep.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{rep.rank}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{rep.name}</div>
                        <div className="text-[10px] text-slate-400">{rep.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">{rep.leads} scans</div>
                      <div className="text-[10px] font-bold text-rose-600">{rep.hot} hot qualified</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-[11px] text-slate-400 font-mono">
                Stand: {selectedBooth.booth} • Status: {selectedBooth.status}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => alert(`Exporting ${selectedBooth.name} telemetry report as CSV...`)}
                  className="text-xs font-bold gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedBooth(null)}
                  className="text-xs font-bold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
