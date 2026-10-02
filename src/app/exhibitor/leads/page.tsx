'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { exportLeadsToExcel, exportLeadsToCsv } from '@/lib/utils/export-excel';
import { Lead, LeadRating, LeadStatus } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, Download, Filter, ChevronRight, Eye, Phone, Mail, Building2, User, Sparkles, CheckSquare, ShieldCheck, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { localDb } from '@/lib/db/dexie';
import { triggerSync } from '@/lib/db/sync-engine';
import { useAuth } from '@/lib/auth/context';

export default function ExhibitorLeadsPage() {
  const { isDemoMode } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());

  const refreshAllLeads = async () => {
    setIsRefreshing(true);
    try {
      // 1. Flush any pending offline sync queue items to Supabase
      await triggerSync().catch(() => {});

      // 2. Fetch live leads from Supabase PostgreSQL
      const { data: dbLeads, error: sbErr } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // 3. Fetch local leads from Dexie
      const localLeads = await localDb.leads.toArray().catch(() => []);

      const serverList = (dbLeads && dbLeads.length > 0) ? (dbLeads as Lead[]) : [];
      
      // 4. Merge server and local leads, deduplicating by ID or idempotency_key or email
      const seenIds = new Set<string>();
      const merged: Lead[] = [];

      for (const lead of serverList) {
        if (!seenIds.has(lead.id)) {
          seenIds.add(lead.id);
          merged.push(lead);
        }
      }

      for (const localLead of localLeads) {
        const alreadyExists = merged.some(
          (m) =>
            m.id === localLead.id ||
            m.id === (localLead as any).server_id ||
            (localLead.idempotency_key && (m as any).idempotency_key === localLead.idempotency_key) ||
            (localLead.email && m.email && localLead.email === m.email && localLead.company === m.company)
        );

        if (!alreadyExists && !seenIds.has(localLead.id)) {
          seenIds.add(localLead.id);
          merged.push(localLead as Lead);
        }
      }

      let combined: Lead[] = merged;
      // In demo mode only, fallback to INITIAL_LEADS if empty
      if (isDemoMode && combined.length === 0) {
        combined = [...INITIAL_LEADS];
      }

      combined.sort((a, b) => {
        const tA = new Date(a.created_at || a.captured_at || 0).getTime();
        const tB = new Date(b.created_at || b.captured_at || 0).getTime();
        return tB - tA;
      });
      setLeads(combined);

      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn('Error refreshing exhibitor leads:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAllLeads();

    // Set up real-time subscription for new leads inserted via badge/batch scan
    const channel = supabase
      .channel('exhibitor-leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          refreshAllLeads();
        }
      )
      .subscribe();

    // Auto-refresh interval every 15 seconds
    const interval = setInterval(() => {
      refreshAllLeads();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

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
    <div className="space-y-5">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3 h-3 text-brand-600" />
            RLS Tenant Isolated
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Company Leads Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredLeads.length} leads matching filters • Full audit trail preserved
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllLeads}
            disabled={isRefreshing}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 hover:border-brand-300 text-slate-700"
            title={`Last synced: ${lastRefreshedAt}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Cloud'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportLeadsToCsv(filteredLeads)}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 hover:border-brand-300"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleExportSelected}
            className="text-xs font-bold gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel ({selectedLeadIds.size > 0 ? selectedLeadIds.size : 'All'})</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 sm:p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search visitor name, company, email, rep, product..."
              className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-9 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
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
              className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2.5 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="all">All Pipeline Stages</option>
              <option value="new">New Lead</option>
              <option value="qualified">Qualified</option>
              <option value="demo_required">Demo Required</option>
              <option value="quotation_required">Quotation Required</option>
              <option value="follow_up">Follow-up</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Batch Actions Bar (when items selected) */}
      {selectedLeadIds.size > 0 && (
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            <span className="font-bold text-brand-900">
              {selectedLeadIds.size} {selectedLeadIds.size === 1 ? 'lead' : 'leads'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedLeadIds(new Set())}
              className="text-[11px] h-7 bg-white"
            >
              Clear Selection
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleExportSelected}
              className="text-[11px] h-7 font-bold bg-brand-700 hover:bg-brand-800"
            >
              Export Selected ({selectedLeadIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* High-Density Data Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.size > 0 && selectedLeadIds.size === filteredLeads.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="p-3.5">Visitor Name</th>
                <th className="p-3.5">Company & Role</th>
                <th className="p-3.5">Product Interest</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Captured By</th>
                <th className="p-3.5">Sync Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeadIds.has(lead.id);
                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-brand-50/40 transition ${isSelected ? 'bg-brand-50/70' : ''}`}
                  >
                    <td className="p-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(lead.id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div className="font-black text-slate-900 leading-snug">{lead.first_name} {lead.last_name}</div>
                      <div className="text-[11px] font-normal text-slate-400 font-mono">{lead.email}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{lead.company}</div>
                      <div className="text-[11px] text-slate-400">{lead.job_title}</div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {lead.product_interest || 'Enterprise Solution'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={lead.rating as any}>{lead.rating.toUpperCase()}</Badge>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 font-medium">
                      {lead.captured_by_name || 'Tariq Mansoor'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="synced">Synced</Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link href={`/app/lead/${lead.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-bold gap-1 text-brand-700 hover:text-brand-900 hover:bg-brand-50">
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
