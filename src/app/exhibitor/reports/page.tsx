'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_LEADS, INITIAL_FOLLOWUPS } from '@/lib/data/mock-store';
import { exportLeadsToExcel } from '@/lib/utils/export-excel';
import { FileSpreadsheet, Download, Users, Flame, Tag, CheckCircle2, Clock, Building2 } from 'lucide-react';

export default function ExhibitorReportsPage() {
  const [activeTab, setActiveTab] = useState<'rep' | 'product' | 'rating' | 'followup'>('rep');

  // Rep performance stats
  const repStats = [
    { rep: 'Tariq Mansoor', leads: 28, hot: 12, followups: 8, completed: 5, convRate: '43%' },
    { rep: 'Sarah Jenkins', leads: 19, hot: 6, followups: 6, completed: 4, convRate: '32%' },
    { rep: 'David Miller (Admin)', leads: 12, hot: 5, followups: 3, completed: 3, convRate: '41%' },
  ];

  // Product report stats
  const productStats = [
    { product: 'Enterprise AI Platform', count: 26, estValue: '$340,000' },
    { product: 'Cloud Infrastructure & Security', count: 18, estValue: '$210,000' },
    { product: 'Smart Analytics & CRM Suite', count: 15, estValue: '$125,000' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Executive Reporting</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event Commercial Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Representative performance, lead velocity, rating distribution, and pipeline conversions.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => exportLeadsToExcel(INITIAL_LEADS)}
          className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Complete Lead Report (.xlsx)</span>
        </Button>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        {[
          { key: 'rep', label: 'Representative Performance', icon: Users },
          { key: 'product', label: 'Product Interest & Pipeline', icon: Tag },
          { key: 'rating', label: 'Lead Rating (Hot/Warm/Cold)', icon: Flame },
          { key: 'followup', label: 'Follow-Up Task Delivery', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 pb-3 border-b-2 transition ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Representative Performance Report */}
      {activeTab === 'rep' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Representative</th>
                <th className="p-3">Total Leads</th>
                <th className="p-3">Hot Leads</th>
                <th className="p-3">Follow-Ups</th>
                <th className="p-3">Completed</th>
                <th className="p-3">Hot Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repStats.map((r) => (
                <tr key={r.rep} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-900">{r.rep}</td>
                  <td className="p-3 font-black text-blue-600 text-sm">{r.leads}</td>
                  <td className="p-3 font-semibold text-red-600">🔥 {r.hot}</td>
                  <td className="p-3 font-medium text-slate-700">{r.followups}</td>
                  <td className="p-3 font-medium text-emerald-600">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {r.completed}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{r.convRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 2: Product Interest & Pipeline Report */}
      {activeTab === 'product' && (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">Product / Solution</th>
                <th className="p-3">Qualified Leads</th>
                <th className="p-3">Estimated Pipeline Value</th>
                <th className="p-3">Demand Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productStats.map((p) => (
                <tr key={p.product} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-900">{p.product}</td>
                  <td className="p-3 font-black text-blue-600 text-sm">{p.count} leads</td>
                  <td className="p-3 font-bold text-emerald-700">{p.estValue}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${Math.round((p.count / 59) * 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-500 font-mono">
                        {Math.round((p.count / 59) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 3: Rating Report */}
      {activeTab === 'rating' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-t-4 border-t-red-500 text-center">
            <span className="text-3xl">🔥</span>
            <h3 className="text-lg font-black text-red-700 mt-2">Hot (Immediate Intent)</h3>
            <p className="text-3xl font-black text-slate-900 mt-2">23</p>
            <p className="text-xs text-slate-400 mt-1">39% of total captures</p>
          </Card>

          <Card className="border-t-4 border-t-amber-500 text-center">
            <span className="text-3xl">☀️</span>
            <h3 className="text-lg font-black text-amber-700 mt-2">Warm (1-3 Months)</h3>
            <p className="text-3xl font-black text-slate-900 mt-2">27</p>
            <p className="text-xs text-slate-400 mt-1">45% of total captures</p>
          </Card>

          <Card className="border-t-4 border-t-sky-500 text-center">
            <span className="text-3xl">❄️</span>
            <h3 className="text-lg font-black text-sky-700 mt-2">Cold (General Info)</h3>
            <p className="text-3xl font-black text-slate-900 mt-2">9</p>
            <p className="text-xs text-slate-400 mt-1">16% of total captures</p>
          </Card>
        </div>
      )}

      {/* Tab 4: Follow-up Report */}
      {activeTab === 'followup' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Tasks</span>
            <span className="text-3xl font-black text-blue-600 mt-1 block">17</span>
            <span className="text-xs text-slate-500 mt-1 block">Due this week</span>
          </Card>

          <Card className="p-4 text-center">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Completed Tasks</span>
            <span className="text-3xl font-black text-emerald-700 mt-1 block">12</span>
            <span className="text-xs text-slate-500 mt-1 block">Successfully delivered</span>
          </Card>

          <Card className="p-4 text-center">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Overdue Tasks</span>
            <span className="text-3xl font-black text-amber-700 mt-1 block">0</span>
            <span className="text-xs text-slate-500 mt-1 block">100% on-time delivery</span>
          </Card>
        </div>
      )}
    </div>
  );
}
