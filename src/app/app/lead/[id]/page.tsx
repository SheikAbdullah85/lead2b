'use client';

export const runtime = 'edge';

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
  MapPin, Globe, Plus, CheckCircle2, Flame, Tag, FileText, Send, Sparkles, ShieldCheck,
  Volume2, VolumeX, Mic
} from 'lucide-react';
import {
  speakText,
  stopSpeaking,
  isSpeechSynthesisSupported,
  generateLeadVoiceBriefing,
} from '@/lib/utils/speech';

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [followups, setFollowups] = useState<FollowupTask[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);

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
      <div className="py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-500">Loading lead details...</p>
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

  const handleToggleLeadBriefing = () => {
    if (!lead) return;
    if (isPlayingBriefing) {
      stopSpeaking();
      setIsPlayingBriefing(false);
      return;
    }
    const text = generateLeadVoiceBriefing(lead);
    setIsPlayingBriefing(true);
    setPlayingNoteId(null);
    speakText(text, {
      onEnd: () => setIsPlayingBriefing(false),
      onError: () => setIsPlayingBriefing(false),
    });
  };

  const handlePlayNoteVoice = (noteId: string, noteText: string) => {
    if (playingNoteId === noteId) {
      stopSpeaking();
      setPlayingNoteId(null);
      return;
    }
    stopSpeaking();
    setIsPlayingBriefing(false);
    setPlayingNoteId(noteId);
    speakText(noteText, {
      onEnd: () => setPlayingNoteId(null),
      onError: () => setPlayingNoteId(null),
    });
  };

  const timelineItems: TimelineItem[] = [
    {
      id: 'tl_1',
      type: 'capture',
      title: `Lead captured via ${lead.capture_method || 'QR Badge'}`,
      description: `Visitor scanned at GITEX Booth H3-B24 with priority ${lead.rating.toUpperCase()}`,
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

  const initials = `${lead.first_name?.[0] || ''}${lead.last_name?.[0] || ''}`.toUpperCase() || 'L';

  return (
    <div className="space-y-4 pb-12">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-700 px-2 py-1 -ml-2 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Back to Leads</span>
        </button>
        <div className="flex items-center gap-2">
          <Badge variant={lead.sync_status === 'synced' ? 'synced' : 'pending'}>
            {lead.sync_status === 'synced' ? 'Cloud Synced' : 'Offline Stored'}
          </Badge>
          <Badge variant={lead.rating as any}>{lead.rating.toUpperCase()}</Badge>
        </div>
      </div>

      {/* Contact Profile Header Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white flex items-center justify-center font-black text-xl shadow-sm ring-4 ring-brand-50 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black text-slate-900 leading-tight truncate">
              {lead.first_name} {lead.last_name}
            </h2>
            <p className="text-sm font-bold text-brand-700 flex items-center gap-1.5 mt-0.5 truncate">
              <Building2 className="w-4 h-4 text-brand-500 shrink-0" />
              <span className="truncate">{lead.company || 'Enterprise Visitor'}</span>
            </p>
            {lead.job_title && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{lead.job_title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Direct Action Dock: Call, Email, WhatsApp, Follow-up Task */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <a
            href={lead.mobile ? `tel:${lead.mobile}` : '#'}
            className={`py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${
              lead.mobile
                ? 'bg-brand-50/80 text-brand-800 border-brand-200 hover:bg-brand-100 active:scale-95'
                : 'opacity-40 pointer-events-none bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <Phone className="w-4 h-4 text-brand-600" />
            <span className="text-[10px] font-bold">Call</span>
          </a>

          <a
            href={lead.email ? `mailto:${lead.email}?subject=GITEX 2026 Follow-up` : '#'}
            className={`py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${
              lead.email
                ? 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 active:scale-95'
                : 'opacity-40 pointer-events-none bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-slate-600" />
            <span className="text-[10px] font-bold">Email</span>
          </a>

          <a
            href={
              lead.mobile
                ? `https://wa.me/${lead.mobile.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(
                    lead.first_name
                  )},%20pleasure%20meeting%20you%20at%20GITEX!`
                : '#'
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border transition ${
              lead.mobile
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 active:scale-95'
                : 'opacity-40 pointer-events-none bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold">WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={() => setIsFollowupModalOpen(true)}
            className="py-2.5 px-1 rounded-xl text-center flex flex-col items-center justify-center gap-1 border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 active:scale-95 transition"
          >
            <CalendarPlus className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold">Task</span>
          </button>
        </div>

        {/* Lead Audio Briefing (Text Information to Voice Note) */}
        {isSpeechSynthesisSupported() && (
          <button
            type="button"
            onClick={handleToggleLeadBriefing}
            className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition shadow-2xs ${
              isPlayingBriefing
                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                : 'bg-gradient-to-r from-amber-50 to-orange-50/70 text-amber-900 border-amber-200/80 hover:bg-amber-100/70'
            }`}
          >
            <div className="flex items-center gap-2">
              <Volume2 className={`w-4 h-4 ${isPlayingBriefing ? 'animate-bounce text-white' : 'text-amber-600'}`} />
              <span>{isPlayingBriefing ? 'Playing Lead Audio Briefing...' : 'Play Lead Audio Briefing (Voice Note)'}</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full text-amber-800 border border-amber-200/60 font-black">
              {isPlayingBriefing ? 'Tap to Stop' : 'Text to Voice'}
            </span>
          </button>
        )}
      </div>

      {/* Qualification Highlights */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 text-xs">
        <h3 className="font-black uppercase tracking-wider text-slate-400 text-[10px] flex items-center justify-between">
          <span>Qualification Details</span>
          <span className="text-brand-600 font-bold normal-case">5-Sec Form Verified</span>
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Product Interest</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{lead.product_interest || 'Enterprise Solution'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Purchase Timeline</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{lead.purchase_timeline || '1-3 months'}</span>
          </div>
        </div>

        {lead.requirement && (
          <div className="p-3 rounded-xl bg-brand-50/70 border border-brand-200/60 text-brand-950">
            <span className="text-[10px] text-brand-700 font-black uppercase tracking-wider block">
              Visitor Pain Point & Notes:
            </span>
            <p className="mt-1 text-xs font-medium leading-relaxed">{lead.requirement}</p>
          </div>
        )}
      </div>

      {/* Voice Notes Component with Natural Language Transcription */}
      <VoiceRecorder
        onAudioRecorded={(blob, duration, transcribedText, extractedLead) => {
          const newNote: LeadNote = {
            id: `voice_${Date.now()}`,
            lead_id: lead.id,
            tenant_id: lead.tenant_id,
            user_id: lead.captured_by,
            user_name: lead.captured_by_name || 'Tariq Mansoor',
            note_text: transcribedText || `🎙️ [Voice Memo: ${duration}s duration recorded at booth]`,
            created_at: new Date().toISOString(),
          };
          setNotes([newNote, ...notes]);
          if (extractedLead?.rating && extractedLead.rating !== lead.rating) {
            setLead({ ...lead, rating: extractedLead.rating });
          }
        }}
      />

      {/* Notes & Rep Log */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-600" />
            <span>Booth Notes ({notes.length})</span>
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="text-[11px] h-7 px-2.5 font-bold text-brand-700 hover:text-brand-900 hover:bg-brand-50"
          >
            {isAddingNote ? 'Cancel' : '+ Add Note'}
          </Button>
        </div>

        {isAddingNote && (
          <form onSubmit={handleAddNote} className="space-y-2.5 pt-1">
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Type booth conversation details, specific budget or questions..."
              rows={2}
              className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800"
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
            <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-slate-800 font-medium leading-relaxed flex-1">{n.note_text}</p>
                {isSpeechSynthesisSupported() && (
                  <button
                    type="button"
                    onClick={() => handlePlayNoteVoice(n.id, n.note_text)}
                    className={`p-1.5 rounded-lg border text-xs font-bold transition shrink-0 ${
                      playingNoteId === n.id
                        ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                    title="Play text as Voice Note"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">
                {new Date(n.created_at).toLocaleString()} • {n.user_name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Audit & Sync Timeline</span>
        </h3>
        <ActivityTimeline items={timelineItems} />
      </div>

      {/* Follow-up Scheduling Modal */}
      <Modal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        title="Schedule Follow-Up Task"
        description={`For ${lead.first_name} ${lead.last_name}`}
      >
        <form onSubmit={handleCreateFollowup} className="space-y-3.5">
          <Input
            label="Task Title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Schedule AI Product Demo"
            required
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Task Type
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="w-full h-11 text-xs rounded-xl border border-slate-300 px-3 bg-white font-medium focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="demo">Live Product Demo</option>
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
