'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lead, LeadNote, FollowupTask } from '@/lib/types';
import { INITIAL_LEADS, INITIAL_NOTES, INITIAL_FOLLOWUPS } from '@/lib/data/mock-store';
import { localDb } from '@/lib/db/dexie';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { VoiceRecorder } from '@/components/audio/VoiceRecorder';
import { ActivityTimeline, TimelineItem } from '@/components/layout/ActivityTimeline';
import {
  ArrowLeft, Phone, Mail, MessageCircle, CalendarPlus, Clock, Building2, User,
  MapPin, Globe, Plus, CheckCircle2, Flame, Tag, FileText, Send
} from 'lucide-react';

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [followups, setFollowups] = useState<FollowupTask[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Follow-up modal state
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<FollowupTask['task_type']>('demo');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10));

  useEffect(() => {
    const fetchLeadData = async () => {
      // Check local Dexie first, then fallback to mock store
      const local = await localDb.leads.get(params.id);
      if (local) {
        setLead(local);
      } else {
        const found = INITIAL_LEADS.find((l) => l.id === params.id || l.local_id === params.id);
        if (found) setLead(found);
      }

      setNotes(INITIAL_NOTES.filter((n) => n.lead_id === params.id));
      setFollowups(INITIAL_FOLLOWUPS.filter((f) => f.lead_id === params.id));
    };

    fetchLeadData();
  }, [params.id]);

  if (!lead) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-slate-500">Loading lead details...</p>
      </div>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: LeadNote = {
      id: `note_${Date.now()}`,
      lead_id: lead.id,
      tenant_id: lead.tenant_id,
      user_id: lead.captured_by,
      user_name: lead.captured_by_name || 'Tariq Mansoor',
      note_text: newNoteText.trim(),
      created_at: new Date().toISOString(),
      sync_status: 'synced',
    };

    setNotes([newNote, ...notes]);
    setNewNoteText('');
    setIsAddingNote(false);
  };

  const handleCreateFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;

    const newTask: FollowupTask = {
      id: `foll_${Date.now()}`,
      tenant_id: lead.tenant_id,
      event_id: lead.event_id,
      lead_id: lead.id,
      lead_name: `${lead.first_name} ${lead.last_name}`,
      lead_company: lead.company,
      lead_mobile: lead.mobile,
      lead_email: lead.email,
      task_type: taskType,
      task_title: taskTitle,
      due_date: new Date(dueDate).toISOString(),
      priority: 'high',
      status: 'open',
      created_by: lead.captured_by,
      created_at: new Date().toISOString(),
      sync_status: 'synced',
    };

    setFollowups([newTask, ...followups]);
    setIsFollowupModalOpen(false);
    setTaskTitle('');
  };

  const timelineItems: TimelineItem[] = [
    {
      id: 'tl_1',
      type: 'capture',
      title: `Lead captured via ${lead.capture_method || 'QR'}`,
      description: `Visitor scanned at GITEX Booth H3-B24 with rating ${lead.rating.toUpperCase()}`,
      timestamp: lead.captured_at || lead.created_at,
      author: lead.captured_by_name || 'Tariq Mansoor',
    },
    ...notes.map((n) => ({
      id: n.id,
      type: 'note' as const,
      title: 'Note added',
      description: n.note_text,
      timestamp: n.created_at,
      author: n.user_name,
    })),
    ...followups.map((f) => ({
      id: f.id,
      type: 'followup' as const,
      title: `Follow-up created: ${f.task_title}`,
      description: `Due on ${new Date(f.due_date).toLocaleDateString()}`,
      timestamp: f.created_at,
    })),
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant={lead.sync_status === 'synced' ? 'synced' : 'pending'}>
            {lead.sync_status === 'synced' ? 'Synced' : 'Offline'}
          </Badge>
          <Badge variant={lead.rating as any}>{lead.rating.toUpperCase()}</Badge>
        </div>
      </div>

      {/* Contact Profile Header Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {lead.first_name} {lead.last_name}
            </h2>
            <p className="text-sm font-bold text-blue-600 flex items-center gap-1 mt-0.5">
              <Building2 className="w-4 h-4" />
              <span>{lead.company || 'Enterprise Corp'}</span>
            </p>
            {lead.job_title && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5" />
                <span>{lead.job_title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Direct Action Buttons: Phone, Email, WhatsApp as required */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <a
            href={lead.mobile ? `tel:${lead.mobile}` : '#'}
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${
              lead.mobile
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 active:scale-95'
                : 'opacity-40 pointer-events-none bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span className="text-[10px] font-bold">Call</span>
          </a>

          <a
            href={lead.email ? `mailto:${lead.email}?subject=GITEX 2026 Follow-up` : '#'}
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${
              lead.email
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 active:scale-95'
                : 'opacity-40 pointer-events-none bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span className="text-[10px] font-bold">Email</span>
          </a>

          <a
            href={
              lead.mobile
                ? `https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                    lead.first_name
                  )},%20great%20connecting%20at%20GITEX!`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${
              lead.mobile
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 active:scale-95'
                : 'opacity-40 pointer-events-none bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold">WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setIsFollowupModalOpen(true)}
            className="py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95 transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span className="text-[10px] font-bold">Task</span>
          </button>
        </div>
      </div>

      {/* Qualification Highlights */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-xs">
        <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
          Qualification Details
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Product Interest</span>
            <span className="font-semibold text-slate-800">{lead.product_interest || 'Enterprise Solution'}</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block">Purchase Timeline</span>
            <span className="font-semibold text-slate-800">{lead.purchase_timeline || '1-3 months'}</span>
          </div>
        </div>
        {lead.requirement && (
          <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 text-blue-900">
            <span className="text-[10px] text-blue-500 font-bold block">Requirement / Pain Point:</span>
            <p className="mt-0.5">{lead.requirement}</p>
          </div>
        )}
      </div>

      {/* Voice Notes Component */}
      <VoiceRecorder
        onAudioRecorded={(blob, duration) => {
          const newNote: LeadNote = {
            id: `voice_${Date.now()}`,
            lead_id: lead.id,
            tenant_id: lead.tenant_id,
            user_id: lead.captured_by,
            user_name: lead.captured_by_name,
            note_text: `[Voice Note Recorded: ${duration}s duration]`,
            created_at: new Date().toISOString(),
          };
          setNotes([newNote, ...notes]);
        }}
      />

      {/* Notes Section */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Notes & Activity ({notes.length})</span>
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="text-[11px] h-7 px-2 font-bold text-blue-600"
          >
            {isAddingNote ? 'Cancel' : '+ Add Note'}
          </Button>
        </div>

        {isAddingNote && (
          <form onSubmit={handleAddNote} className="space-y-2">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Type note details here..."
              rows={2}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              autoFocus
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" variant="primary" className="text-xs font-bold">
                Save Note
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
              <p className="text-slate-800">{n.note_text}</p>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                {new Date(n.created_at).toLocaleString()} • {n.user_name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Audit Timeline</span>
        </h3>
        <ActivityTimeline items={timelineItems} />
      </div>

      {/* Create Follow-up Modal */}
      <Modal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        title="Schedule Follow-Up Task"
        description={`For ${lead.first_name} ${lead.last_name}`}
      >
        <form onSubmit={handleCreateFollowup} className="space-y-3">
          <Input
            label="Task Title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Executive Demo on Arabic AI"
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Task Type
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="w-full h-11 text-xs rounded-lg border border-slate-300 px-3 bg-white"
            >
              <option value="demo">Live Demo</option>
              <option value="proposal">Send Proposal / Quotation</option>
              <option value="call">Follow-up Call</option>
              <option value="meeting">Schedule In-person Meeting</option>
              <option value="WhatsApp">WhatsApp Message</option>
            </select>
          </div>

          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsFollowupModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold">
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
