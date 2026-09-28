'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Plus, Building2, Flame, Sun, ChevronRight, User } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { localDb } from '@/lib/db/dexie';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { Lead } from '@/lib/types';

export default function MobileLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  useEffect(() => {
    const loadAllLeads = async () => {
      try {
        const localList = await localDb.leads.toArray();
        if (localList.length > 0) {
          const ids = new Set(localList.map((l) => l.id));
          const merged = [...localList, ...INITIAL_LEADS.filter((l) => !ids.has(l.id))];
          setLeads(merged);
        } else {
          setLeads(INITIAL_LEADS);
        }
      } catch (e) {
        setLeads(INITIAL_LEADS);
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

  return (
    <div className="space-y-3">
      {/* Header with Title and Add Lead */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 leading-none">Captured Leads</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filteredLeads.length} leads in event</p>
        </div>
        <Link href="/app/lead/new">
          <Button size="sm" variant="primary" className="text-xs font-bold gap-1 shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>New Lead</span>
          </Button>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name, company, product..."
          className="w-full text-xs rounded-xl border border-slate-300 pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs"
        />
      </div>

      {/* Rating Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setRatingFilter('all')}
          className={`px-3 py-1 rounded-full font-semibold transition ${
            ratingFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({leads.length})
        </button>
        <button
          onClick={() => setRatingFilter('hot')}
          className={`px-3 py-1 rounded-full font-semibold transition flex items-center gap-1 ${
            ratingFilter === 'hot'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
          }`}
        >
          <span>🔥 Hot</span>
          <span>({leads.filter((l) => l.rating === 'hot').length})</span>
        </button>
        <button
          onClick={() => setRatingFilter('warm')}
          className={`px-3 py-1 rounded-full font-semibold transition flex items-center gap-1 ${
            ratingFilter === 'warm'
              ? 'bg-amber-600 text-white'
              : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50'
          }`}
        >
          <span>☀️ Warm</span>
          <span>({leads.filter((l) => l.rating === 'warm').length})</span>
        </button>
        <button
          onClick={() => setRatingFilter('cold')}
          className={`px-3 py-1 rounded-full font-semibold transition flex items-center gap-1 ${
            ratingFilter === 'cold'
              ? 'bg-sky-600 text-white'
              : 'bg-white border border-sky-200 text-sky-700 hover:bg-sky-50'
          }`}
        >
          <span>❄️ Cold</span>
          <span>({leads.filter((l) => l.rating === 'cold').length})</span>
        </button>
      </div>

      {/* Leads List */}
      <div className="space-y-2 pt-1">
        {filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No leads match your filter.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <Link key={lead.id} href={`/app/lead/${lead.id}`} className="block">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-400 transition flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 mt-0.5">
                    {lead.first_name[0]}{lead.last_name[0]}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 leading-none">
                        {lead.first_name} {lead.last_name}
                      </h4>
                      <Badge variant={lead.rating as any} size="sm">
                        {lead.rating.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lead.company || 'Enterprise Corp'}</span>
                      {lead.job_title && <span className="text-slate-400 font-normal">• {lead.job_title}</span>}
                    </p>

                    <p className="text-[11px] text-blue-600 font-medium mt-0.5">
                      {lead.product_interest}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant={lead.sync_status === 'synced' ? 'synced' : 'pending'}>
                    {lead.sync_status === 'synced' ? 'Synced' : 'Offline'}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(lead.created_at || lead.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
