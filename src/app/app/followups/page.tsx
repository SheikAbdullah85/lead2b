'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { INITIAL_FOLLOWUPS } from '@/lib/data/mock-store';
import { FollowupTask } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Clock, Phone, Mail, MessageCircle, CalendarCheck, Check } from 'lucide-react';

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

  return (
    <div className="space-y-3 pb-8">
      <div>
        <h2 className="text-lg font-black text-slate-900 leading-none">Sales Follow-ups</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tasks scheduled across GITEX leads</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600">
        <button
          onClick={() => setFilter('open')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            filter === 'open' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
          }`}
        >
          Open ({tasks.filter((t) => t.status === 'open').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            filter === 'completed' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
          }`}
        >
          Completed ({tasks.filter((t) => t.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            filter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
          }`}
        >
          All ({tasks.length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5 pt-1">
        {filteredTasks.map((task) => {
          const isDone = task.status === 'completed';
          return (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition ${
                isDone
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200 shadow-xs hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleComplete(task.id)}
                  className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-slate-300 hover:border-emerald-500'
                  }`}
                >
                  {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {task.task_type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className={`text-sm font-bold mt-1 text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                    {task.task_title}
                  </h4>

                  <Link href={`/app/lead/${task.lead_id}`} className="block mt-1">
                    <p className="text-xs font-semibold text-blue-600 hover:underline">
                      {task.lead_name} {task.lead_company ? `(${task.lead_company})` : ''}
                    </p>
                  </Link>

                  {task.description && (
                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                  )}

                  {/* Quick Action buttons */}
                  {!isDone && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                      {task.lead_mobile && (
                        <a
                          href={`tel:${task.lead_mobile}`}
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 px-2 py-1 bg-slate-100 rounded-md"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                      {task.lead_email && (
                        <a
                          href={`mailto:${task.lead_email}`}
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 px-2 py-1 bg-slate-100 rounded-md"
                        >
                          <Mail className="w-3 h-3" /> Email
                        </a>
                      )}
                      {task.lead_mobile && (
                        <a
                          href={`https://wa.me/${task.lead_mobile.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-1 bg-emerald-50 rounded-md"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
