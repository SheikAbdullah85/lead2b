'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_EVENTS } from '@/lib/data/mock-store';
import { Event } from '@/lib/types';
import { useAuth } from '@/lib/auth/context';
import { Calendar, MapPin, Plus, Building2, Clock, Globe, Sparkles, Layers, Trash2, LayoutGrid, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface HallItem {
  id: string;
  name: string;
  code: string;
  standsCount: number;
}

interface StandItem {
  id: string;
  standNumber: string;
  hallName: string;
  exhibitorName: string;
  status: 'allocated' | 'available' | 'reserved';
  sizeSqm: number;
}

const DEMO_HALLS: HallItem[] = [
  { id: 'h0', name: 'Main Pavilion', code: 'MP', standsCount: 6 },
  { id: 'h1', name: 'Hall 1 - Main Concourse', code: 'H1', standsCount: 8 },
  { id: 'h2', name: 'Hall 2 - Enterprise AI & Cloud', code: 'H2', standsCount: 12 },
  { id: 'h3', name: 'Hall 3 - Cyber Valley', code: 'H3', standsCount: 10 },
];

const DEMO_STANDS: StandItem[] = [
  { id: 's0', standNumber: 'TK-01', hallName: 'Main Pavilion', exhibitorName: 'Craftix Technologies', status: 'allocated', sizeSqm: 40 },
  { id: 's1', standNumber: 'H3-B24', hallName: 'Hall 3 - Cyber Valley', exhibitorName: 'Alpha Technology Group', status: 'allocated', sizeSqm: 36 },
  { id: 's2', standNumber: 'H2-A10', hallName: 'Hall 2 - Enterprise AI & Cloud', exhibitorName: 'Beta Solutions Corp', status: 'allocated', sizeSqm: 24 },
  { id: 's3', standNumber: 'H1-C05', hallName: 'Hall 1 - Main Concourse', exhibitorName: 'Siemens Global', status: 'allocated', sizeSqm: 48 },
  { id: 's4', standNumber: 'TK-02', hallName: 'Main Pavilion', exhibitorName: 'Available Stand', status: 'available', sizeSqm: 24 },
  { id: 's5', standNumber: 'H3-B25', hallName: 'Hall 3 - Cyber Valley', exhibitorName: 'Available Stand', status: 'available', sizeSqm: 18 },
  { id: 's6', standNumber: 'H2-B12', hallName: 'Hall 2 - Enterprise AI & Cloud', exhibitorName: 'Available Stand', status: 'available', sizeSqm: 24 },
];

export default function AdminEventsPage() {
  const { user, isDemoMode } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Floorplan Modal State
  const [isFloorplanModalOpen, setIsFloorplanModalOpen] = useState(false);
  const [selectedEventForFloorplan, setSelectedEventForFloorplan] = useState<Event | null>(null);
  const [floorplanTab, setFloorplanTab] = useState<'visual' | 'halls' | 'stands'>('visual');

  // Halls & Stands state
  const [halls, setHalls] = useState<HallItem[]>(() => (isDemoMode ? DEMO_HALLS : []));
  const [stands, setStands] = useState<StandItem[]>(() => (isDemoMode ? DEMO_STANDS : []));

  // Form states for adding Hall / Stand
  const [newHallName, setNewHallName] = useState('');
  const [newHallCode, setNewHallCode] = useState('');
  const [newStandNumber, setNewStandNumber] = useState('');
  const [newStandHall, setNewStandHall] = useState('Hall 3 - Cyber Valley');
  const [newStandExhibitor, setNewStandExhibitor] = useState('');
  const [newStandSize, setNewStandSize] = useState(24);

  // Deleted events tombstone tracking so deletions persist across refreshes
  const getDeletedEventIds = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem('lead2b_deleted_event_ids');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) {
      return new Set();
    }
  };

  const markEventDeleted = (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('lead2b_deleted_event_ids');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem('lead2b_deleted_event_ids', JSON.stringify(list));
      }
    } catch (e) {}
  };

  // Load events from Supabase and localStorage on mount
  const loadEvents = async () => {
    try {
      const deletedIds = getDeletedEventIds();
      let storedList: Event[] = [];
      let hasStored = false;

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('lead2b_events');
        if (stored) {
          hasStored = true;
          try {
            storedList = JSON.parse(stored);
          } catch (e) {}
        }
      }

      let serverList: Event[] = [];
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const { data: dbEvents } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false });
        if (dbEvents && dbEvents.length > 0) {
          serverList = dbEvents as Event[];
        }
      }

      let finalEvents: Event[] = [];
      const seen = new Set<string>();

      if (isDemoMode) {
        const baseList = hasStored || serverList.length > 0 ? [...serverList, ...storedList] : [...serverList, ...storedList, ...INITIAL_EVENTS];
        for (const e of baseList) {
          if (!seen.has(e.id) && !deletedIds.has(e.id)) {
            seen.add(e.id);
            finalEvents.push(e);
          }
        }
      } else {
        // LIVE PRODUCTION MODE: Supabase database is the absolute source of truth
        finalEvents = serverList.filter((e) => !deletedIds.has(e.id));
      }

      setEvents(finalEvents);
      if (typeof window !== 'undefined') {
        localStorage.setItem('lead2b_events', JSON.stringify(finalEvents));
      }
    } catch (err) {
      console.warn('Error loading events:', err);
      const deletedIds = getDeletedEventIds();
      setEvents(isDemoMode ? INITIAL_EVENTS.filter(e => !deletedIds.has(e.id)) : []);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [isDemoMode]);

  // Hydrate floorplan data when event is selected
  useEffect(() => {
    if (selectedEventForFloorplan && typeof window !== 'undefined') {
      const storedFp = localStorage.getItem(`lead2b_fp_${selectedEventForFloorplan.id}`);
      if (storedFp) {
        try {
          const parsed = JSON.parse(storedFp);
          if (parsed.halls) setHalls(parsed.halls);
          if (parsed.stands) setStands(parsed.stands);
        } catch (e) {}
      }
    }
  }, [selectedEventForFloorplan]);

  // New Event Form State
  const [eventName, setEventName] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [venue, setVenue] = useState('Dubai World Trade Centre (DWTC)');
  const [city, setCity] = useState('Dubai');
  const [country, setCountry] = useState('United Arab Emirates');
  const [startDate, setStartDate] = useState('2026-10-12');
  const [endDate, setEndDate] = useState('2026-10-16');
  const [organizerName, setOrganizerName] = useState('Dubai World Trade Centre Authority');
  const [description, setDescription] = useState('');

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventCode) return;

    setIsSaving(true);
    const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `eeee${Date.now()}-0000-0000-0000-000000000001`;

    const newEvent: Event = {
      id: generatedId,
      event_name: eventName.trim(),
      event_code: eventCode.trim().toUpperCase(),
      description,
      venue,
      city,
      country,
      start_date: startDate,
      end_date: endDate,
      organizer_name: organizerName,
      status: 'active',
      timezone: 'UTC+04:00',
      allow_offline_attendee_download: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Optimistic UI & Local Storage
    const updated = [newEvent, ...events];
    setEvents(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_events', JSON.stringify(updated));
        localStorage.setItem('lead2b_active_event_id', newEvent.id);
        window.dispatchEvent(new CustomEvent('lead2b_event_changed', { detail: newEvent }));
      } catch (err) {}
    }

    // 2. Persist to Supabase PostgreSQL
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('events').insert([{
          id: newEvent.id,
          event_name: newEvent.event_name,
          event_code: newEvent.event_code,
          description: newEvent.description,
          venue: newEvent.venue,
          city: newEvent.city,
          country: newEvent.country,
          start_date: newEvent.start_date,
          end_date: newEvent.end_date,
          organizer_name: newEvent.organizer_name,
          status: newEvent.status,
          timezone: newEvent.timezone,
          allow_offline_attendee_download: newEvent.allow_offline_attendee_download,
        }]);
      } catch (sbErr) {
        console.warn('Supabase event insert error:', sbErr);
      }
    }

    setIsSaving(false);
    setIsCreateModalOpen(false);
    setEventName('');
    setEventCode('');
    setDescription('');
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    markEventDeleted(id);
    const remaining = events.filter((e) => e.id !== id);
    setEvents(remaining);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lead2b_events', JSON.stringify(remaining));
        if (remaining.length > 0) {
          localStorage.setItem('lead2b_active_event_id', remaining[0].id);
          window.dispatchEvent(new CustomEvent('lead2b_event_changed', { detail: remaining[0] }));
        }
      } catch (err) {}
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        await supabase.from('events').delete().eq('id', id);
      } catch (sbErr) {
        console.warn('Supabase event delete error:', sbErr);
      }
    }
  };

  const handleOpenFloorplan = (evt: Event) => {
    setSelectedEventForFloorplan(evt);
    setIsFloorplanModalOpen(true);
  };

  const handleAddHall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHallName.trim() || !newHallCode.trim()) return;

    const newH: HallItem = {
      id: `h_${Date.now()}`,
      name: newHallName.trim(),
      code: newHallCode.trim().toUpperCase(),
      standsCount: 0,
    };

    const updated = [...halls, newH];
    setHalls(updated);
    setNewHallName('');
    setNewHallCode('');

    if (selectedEventForFloorplan && typeof window !== 'undefined') {
      localStorage.setItem(`lead2b_fp_${selectedEventForFloorplan.id}`, JSON.stringify({ halls: updated, stands }));
    }
  };

  const handleAddStand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStandNumber.trim()) return;

    const newS: StandItem = {
      id: `s_${Date.now()}`,
      standNumber: newStandNumber.trim().toUpperCase(),
      hallName: newStandHall,
      exhibitorName: newStandExhibitor.trim() || 'Available Stand',
      status: newStandExhibitor.trim() ? 'allocated' : 'available',
      sizeSqm: Number(newStandSize) || 24,
    };

    const updatedStands = [...stands, newS];
    setStands(updatedStands);
    setNewStandNumber('');
    setNewStandExhibitor('');

    if (selectedEventForFloorplan && typeof window !== 'undefined') {
      localStorage.setItem(`lead2b_fp_${selectedEventForFloorplan.id}`, JSON.stringify({ halls, stands: updatedStands }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Building2 className="w-3 h-3 text-brand-600" />
            Organizer Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Event Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure exhibition schedules, venues, floorplans, and visitor badge lookups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadEvents}
            className="text-xs font-bold gap-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-bold gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </Button>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 p-12 text-center bg-slate-50/50">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Events Registered</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
            There are currently no active exhibitions or conferences registered in your live workspace. Click below to launch your first event.
          </p>
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="font-black px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span>Create First Event</span>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => (
          <Card key={evt.id} className="border-slate-200/90 shadow-2xs hover:border-brand-300 transition relative group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-800 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md">
                      {evt.event_code}
                    </span>
                    <Badge variant={evt.status === 'active' ? 'synced' : 'default'}>
                      {evt.status.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-black text-slate-900 leading-snug">{evt.event_name}</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{evt.description || 'Global technology exhibition & trade conference'}</p>
                </div>

                <button
                  onClick={() => handleDeleteEvent(evt.id)}
                  className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete Event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs text-slate-600">
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{evt.venue}, {evt.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{evt.start_date} to {evt.end_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="font-mono text-[11px]">Timezone: {evt.timezone}</span>
                </div>
              </div>

              {/* Halls & Booths Mini Badges */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {halls.length} Halls Configured
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {stands.length} Stands
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpenFloorplan(evt);
                  }}
                  className="text-xs h-7 font-bold hover:border-brand-300 hover:text-brand-700 gap-1.5"
                >
                  <LayoutGrid className="w-3 h-3 text-brand-600" />
                  <span>Manage Floorplan</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Exhibition or Conference"
        description="Set up a new event schedule and venue parameters"
      >
        <form onSubmit={handleCreateEvent} className="space-y-3.5">
          <Input
            label="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g. World AI Summit 2026"
            required
          />

          <Input
            label="Event Code"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            placeholder="e.g. WAIS2026"
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Exhibition Centre"
              required
            />
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Dubai"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Organizer Authority"
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            placeholder="Exhibition Authority"
          />

          <div className="pt-2 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1 font-bold" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Interactive Floorplan Management Modal */}
      {isFloorplanModalOpen && selectedEventForFloorplan && (
        <Modal
          isOpen={isFloorplanModalOpen}
          onClose={() => setIsFloorplanModalOpen(false)}
          title={`Floorplan Management • ${selectedEventForFloorplan.event_name}`}
          description="Allocate exhibition halls, stand positions, and square-meter space"
          maxWidth="xl"
        >
          <div className="space-y-4">
            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setFloorplanTab('visual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  floorplanTab === 'visual'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>2D Floorplan Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setFloorplanTab('stands')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  floorplanTab === 'stands'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Stands Directory ({stands.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFloorplanTab('halls')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  floorplanTab === 'halls'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>Halls ({halls.length})</span>
              </button>
            </div>

            {/* TAB 1: Visual 2D Floorplan Grid */}
            {floorplanTab === 'visual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block"></span> Allocated Stand
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300 inline-block"></span> Available
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"></span> Reserved
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">DWTC Dubai Hall Layout</span>
                </div>

                {/* 2D Interactive Grid */}
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {stands.map((stand) => (
                      <div
                        key={stand.id}
                        className={`p-3 rounded-xl border transition-all ${
                          stand.status === 'allocated'
                            ? 'bg-teal-950/80 border-teal-500/50 text-white'
                            : stand.status === 'reserved'
                            ? 'bg-amber-950/70 border-amber-500/50 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black font-mono tracking-tight text-white">{stand.standNumber}</span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">
                            {stand.sizeSqm}m²
                          </span>
                        </div>
                        <p className="text-xs font-bold truncate text-slate-100">{stand.exhibitorName}</p>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">{stand.hallName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Stands Management */}
            {floorplanTab === 'stands' && (
              <div className="space-y-4">
                <form onSubmit={handleAddStand} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Allocate New Stand</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Stand No. (e.g. H3-C12)"
                      value={newStandNumber}
                      onChange={(e) => setNewStandNumber(e.target.value)}
                      className="text-xs h-9 px-3 rounded-xl border border-slate-300 bg-white"
                      required
                    />
                    <select
                      value={newStandHall}
                      onChange={(e) => setNewStandHall(e.target.value)}
                      className="text-xs h-9 px-3 rounded-xl border border-slate-300 bg-white"
                    >
                      {halls.map((h) => (
                        <option key={h.id} value={h.name}>{h.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Exhibitor (e.g. Oracle)"
                      value={newStandExhibitor}
                      onChange={(e) => setNewStandExhibitor(e.target.value)}
                      className="text-xs h-9 px-3 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="w-full text-xs font-bold">
                    Add Stand to Floorplan
                  </Button>
                </form>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                  {stands.map((s) => (
                    <div key={s.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900">{s.standNumber}</span>
                          <span className="font-semibold text-slate-800">{s.exhibitorName}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{s.hallName} • {s.sizeSqm}m²</span>
                      </div>
                      <Badge variant={s.status === 'allocated' ? 'synced' : 'default'}>
                        {s.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Halls Management */}
            {floorplanTab === 'halls' && (
              <div className="space-y-4">
                <form onSubmit={handleAddHall} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Add Exhibition Hall</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Hall Name (e.g. Za'abeel Hall 4)"
                      value={newHallName}
                      onChange={(e) => setNewHallName(e.target.value)}
                      className="text-xs h-9 px-3 rounded-xl border border-slate-300 bg-white"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Hall Code (e.g. ZH4)"
                      value={newHallCode}
                      onChange={(e) => setNewHallCode(e.target.value)}
                      className="text-xs h-9 px-3 rounded-xl border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <Button type="submit" variant="primary" size="sm" className="w-full text-xs font-bold">
                    Save Hall
                  </Button>
                </form>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                  {halls.map((h) => (
                    <div key={h.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">{h.name}</span>
                        <span className="text-[11px] font-mono text-slate-400">Code: {h.code}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {stands.filter(s => s.hallName === h.name).length} Stands
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setIsFloorplanModalOpen(false)} className="font-bold">
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
