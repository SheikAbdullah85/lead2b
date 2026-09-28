'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { exportLeadsToExcel, exportLeadsToCsv } from '@/lib/utils/export-excel';
import { Lead, LeadRating, LeadStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Download, Filter, ChevronRight, Eye, Phone, Mail, Building2, User, Sparkles } from 'lucide-react';

export default function ExhibitorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  const filteredLeads = leads.filter((l) => {
    const textMatch = `${l.first_name} ${l.last_name} ${l.company} ${l.email} ${l.mobile} ${l.product_interest} ${l.captured_by_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const ratingMatch = ratingFilter === 'all' || l.rating === ratingFilter;
    const statusMatch = statusFilter === 'all' || l.status === statusFilter;

    return textMatch && ratingMatch && statusMatch;
  });

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedLeadIds(next);
  };

  const handleExportSelected = () => {
    const toExport = leads.filter((l) => selectedLeadIds.has(l.id));
    exportLeadsToExcel(toExport.length > 0 ? toExport : filteredLeads);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Leads Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredLeads.length} leads captured • Protected by PostgreSQL Row-Level Security
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLeadsToCsv(filteredLeads)}
            className="text-xs font-semibold gap-1.5 bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportSelected}
            className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel ({selectedLeadIds.size > 0 ? selectedLeadIds.size : 'All'})</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, email, rep, product..."
              className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-white"
            >
              <option value="all">All Ratings (Hot, Warm, Cold)</option>
              <option value="hot">🔥 Hot Leads</option>
              <option value="warm">☀️ Warm Leads</option>
              <option value="cold">❄️ Cold Leads</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2.5 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="qualified">Qualified</option>
              <option value="demo_required">Demo Required</option>
              <option value="quotation_required">Quotation Required</option>
              <option value="follow_up">Follow-up</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.size > 0 && selectedLeadIds.size === filteredLeads.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600"
                  />
                </th>
                <th className="p-3">Visitor Name</th>
                <th className="p-3">Company & Role</th>
                <th className="p-3">Product Interest</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Status</th>
                <th className="p-3">Captured By</th>
                <th className="p-3">Sync</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.has(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-blue-50/40 transition ${isSelected ? 'bg-blue-50/70' : ''}`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(lead.id)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      <div>{lead.first_name} {lead.last_name}</div>
                      <div className="text-[11px] font-normal text-slate-400 font-mono">{lead.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{lead.company}</div>
                      <div className="text-[11px] text-slate-400">{lead.job_title}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {lead.product_interest || 'Enterprise Solution'}
                    </td>
                    <td className="p-3">
                      <Badge variant={lead.rating as any}>{lead.rating.toUpperCase()}</Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {lead.captured_by_name || 'Tariq Mansoor'}
                    </td>
                    <td className="p-3">
                      <Badge variant="synced">Synced</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Link href={`/app/lead/${lead.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold gap-1 text-blue-600">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
