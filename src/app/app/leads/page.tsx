'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Building2, Flame, Sun, ChevronRight, User, Phone, MessageCircle, QrCode, CheckCircle2, CloudOff, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { localDb } from '@/lib/db/dexie';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { Lead } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';

export default function MobileLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  useEffect(() => {
    const loadAllLeads = async () => {
      try {
        // Query live Supabase database
        const { data: dbLeads } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        const localList = await localDb.leads.toArray();
        const serverLeads = (dbLeads && dbLeads.length > 0) ? (dbLeads as Lead[]) : INITIAL_LEADS;
        
        // Merge offline/local Dexie leads with server leads
        const serverIds = new Set(serverLeads.map((l) => l.id));
        const pendingLocal = localList.filter((l) => !serverIds.has(l.id));

        setLeads([...pendingLocal, ...serverLeads]);
      } catch (e) {
        const localList = await localDb.leads.toArray();
        setLeads(localList.length > 0 ? localList : INITIAL_LEADS);
      }
    };

    loadAllLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = `${lead.first_name} ${lead.last_name} ${lead.company} ${lead.email} ${lead.product_interest}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'all' || lead.rating === ratingFilter;

    return matchesSearch && matchesRating;
  });

  const hotCount = leads.filter((l) => l.rating === 'hot').length;
  const warmCount = leads.filter((l) => l.rating === 'warm').length;
  const coldCount = leads.filter((l) => l.rating === 'cold').length;
  const syncedCount = leads.filter((l) => l.sync_status === 'synced').length;

  return (
    <div className="space-y-3 pb-8">
      {/* Header with Title and Add Lead */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" />
            GITEX Live Feed
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Captured Leads</h2>
        </div>
        <Link href="/app/lead/new">
          <Button size="sm" variant="primary" className="text-xs font-bold gap-1 shadow-sm">
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Lead</span>
          </Button>
        </Link>
      </div>

      {/* Mini KPI Ticker Strip */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 text-center">
        <div className="p-1.5 bg-white rounded-lg shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Total</span>
          <span className="text-sm font-black text-slate-900">{leads.length}</span>
        </div>
        <div className="p-1.5 bg-white rounded-lg shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-rose-500 block leading-tight">🔥 Hot</span>
          <span className="text-sm font-black text-rose-600">{hotCount}</span>
        </div>
        <div className="p-1.5 bg-white rounded-lg shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-amber-500 block leading-tight">☀️ Warm</span>
          <span className="text-sm font-black text-amber-600">{warmCount}</span>
        </div>
        <div className="p-1.5 bg-white rounded-lg shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-brand-600 block leading-tight">Synced</span>
          <span className="text-sm font-black text-brand-700">{syncedCount}</span>
        </div>
      </div>

      {/* Sleek Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search visitor, company, product..."
          className="w-full text-xs rounded-xl border border-slate-200 pl-10 pr-9 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition shadow-2xs font-medium text-slate-800 placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Rating Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setRatingFilter('all')}
          className={`px-3.5 py-1.5 rounded-full font-bold transition text-xs shrink-0 ${
            ratingFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({leads.length})
        </button>
        <button
          onClick={() => setRatingFilter('hot')}
          className={`px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1 text-xs shrink-0 ${
            ratingFilter === 'hot'
              ? 'bg-rose-500 text-white shadow-xs shadow-rose-500/20'
              : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50'
          }`}
        >
          <span>🔥 Hot</span>
          <span>({hotCount})</span>
        </button>
        <button
          onClick={() => setRatingFilter('warm')}
          className={`px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1 text-xs shrink-0 ${
            ratingFilter === 'warm'
              ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/20'
              : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          <span>☀️ Warm</span>
          <span>({warmCount})</span>
        </button>
        <button
          onClick={() => setRatingFilter('cold')}
          className={`px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1 text-xs shrink-0 ${
            ratingFilter === 'cold'
              ? 'bg-cyan-600 text-white shadow-xs shadow-cyan-600/20'
              : 'bg-white border border-cyan-200 text-cyan-700 hover:bg-cyan-50'
          }`}
        >
          <span>❄️ Cold</span>
          <span>({coldCount})</span>
        </button>
      </div>

      {/* Leads List */}
      <div className="space-y-2.5 pt-1">
        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No leads match your filter</p>
              <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or scan a new badge</p>
            </div>
            <Link href="/app/dashboard" className="inline-block">
              <Button size="sm" variant="primary" className="text-xs font-bold gap-1 mt-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Open Scanner</span>
              </Button>
            </Link>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`.toUpperCase() || 'L';
            const isSynced = lead.sync_status === 'synced';

            return (
              <div
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-brand-300 transition overflow-hidden"
              >
                <Link href={`/app/lead/${lead.id}`} className="block p-3.5 active:bg-slate-50/60 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs ring-2 ring-white">
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 leading-snug truncate">
                            {lead.first_name} {lead.last_name}
                          </h4>
                          <Badge variant={lead.rating as any} size="sm">
                            {lead.rating.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                          <span className="truncate">{lead.company || 'Enterprise Visitor'}</span>
                          {lead.job_title && (
                            <span className="text-slate-400 font-normal truncate">• {lead.job_title}</span>
                          )}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold text-brand-800 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                            {lead.product_interest || 'Enterprise Solution'}
                          </span>
                          {lead.purchase_timeline && (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {lead.purchase_timeline}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sync & Timestamp Column */}
                    <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        {isSynced ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Offline
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(lead.created_at || lead.captured_at || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Direct 1-tap quick actions bar */}
                {(lead.mobile || lead.email) && (
                  <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Connect:</span>
                    <div className="flex items-center gap-1.5">
                      {lead.mobile && (
                        <a
                          href={`tel:${lead.mobile}`}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-700 hover:text-brand-600 hover:border-brand-300 active:scale-95 transition"
                        >
                          <Phone className="w-3 h-3 text-brand-600" />
                          <span>Call</span>
                        </a>
                      )}
                      {lead.mobile && (
                        <a
                          href={`https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                            lead.first_name
                          )},%20pleasure%20meeting%20you%20at%20GITEX!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      <Link
                        href={`/app/lead/${lead.id}`}
                        className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold text-brand-700 hover:text-brand-900"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
