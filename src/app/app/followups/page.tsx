'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INITIAL_FOLLOWUPS } from '@/lib/data/mock-store';
import { FollowupTask } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Clock, Phone, Mail, MessageCircle, CalendarCheck, Check, Sparkles, Building2 } from 'lucide-react';

export default function MobileFollowupsPage() {
  const [tasks, setTasks] = useState<FollowupTask[]>(INITIAL_FOLLOWUPS);
  const [filter, setFilter] = useState<'open' | 'completed' | 'all'>('open');

  const handleToggleComplete = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          const newStatus = t.status === 'completed' ? 'open' : 'completed';
          return {
            ...t,
            status: newStatus,
            completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const openCount = tasks.filter((t) => t.status === 'open').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-3.5 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-500" />
            Booth Commitments
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Sales Follow-ups</h2>
        </div>
        <span className="text-xs font-bold text-brand-800 bg-brand-50 border border-brand-200/60 px-2.5 py-1 rounded-full">
          {openCount} Pending
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold text-slate-600">
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 py-2 rounded-lg transition text-xs ${
            filter === 'open' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
          }`}
        >
          Open ({openCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2 rounded-lg transition text-xs ${
            filter === 'completed' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
          }`}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-lg transition text-xs ${
            filter === 'all' ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
          }`}
        >
          All ({tasks.length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5 pt-1">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {filter === 'open' ? 'All caught up! No pending follow-ups.' : 'No completed tasks yet.'}
            </p>
            <p className="text-xs text-slate-400">
              Schedule tasks from any visitor lead profile.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition ${
                  isDone
                    ? 'bg-slate-50/80 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200/90 shadow-2xs hover:border-brand-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task.id)}
                    className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 hover:border-brand-500 hover:bg-brand-50'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 border border-brand-200/50">
                        {task.task_type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className={`text-sm font-black mt-1 text-slate-900 leading-snug ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {task.task_title}
                    </h4>

                    <Link href={`/app/lead/${task.lead_id}`} className="inline-block mt-1">
                      <p className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-brand-500" />
                        <span>{task.lead_name}</span>
                        {task.lead_company && <span className="text-slate-400 font-normal">({task.lead_company})</span>}
                      </p>
                    </Link>

                    {task.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{task.description}</p>
                    )}

                    {/* Quick Action Dock */}
                    {!isDone && (
                      <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 flex-wrap">
                        {task.lead_mobile && (
                          <a
                            href={`tel:${task.lead_mobile}`}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-brand-700 px-2.5 py-1 bg-slate-100 rounded-lg active:scale-95 transition"
                          >
                            <Phone className="w-3 h-3 text-brand-600" /> Call
                          </a>
                        )}
                        {task.lead_email && (
                          <a
                            href={`mailto:${task.lead_email}`}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-brand-700 px-2.5 py-1 bg-slate-100 rounded-lg active:scale-95 transition"
                          >
                            <Mail className="w-3 h-3 text-slate-500" /> Email
                          </a>
                        )}
                        {task.lead_mobile && (
                          <a
                            href={`https://wa.me/${task.lead_mobile.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 rounded-lg active:scale-95 transition"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" /> WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
