'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_EVENTS } from '@/lib/data/mock-store';
import { Event } from '@/lib/types';
import { Calendar, MapPin, Plus, Building2, Clock, Globe, Sparkles, Layers } from 'lucide-react';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName || !eventCode) return;

    const newEvent: Event = {
      id: `ev_${Date.now()}`,
      event_name: eventName,
      event_code: eventCode.toUpperCase(),
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

    setEvents([newEvent, ...events]);
    setIsCreateModalOpen(false);
    setEventName('');
    setEventCode('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
            <Layers className="w-3 h-3 text-brand-600" />
            Floorplans & Schedules
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Events, Halls & Stands</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure exhibition schedules, hall allocations, and stand coordinates.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          className="text-xs font-bold gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Event</span>
        </Button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((evt) => (
          <Card key={evt.id} className="border-slate-200/90 shadow-2xs hover:border-brand-300 transition">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-800 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-md">
                    {evt.event_code}
                  </span>
                  <CardTitle className="text-lg font-black mt-2">{evt.event_name}</CardTitle>
                </div>
                <Badge variant={evt.status === 'active' ? 'synced' : 'default'}>
                  {evt.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2 text-xs text-slate-600">
              <p className="text-slate-500 line-clamp-2 leading-relaxed">{evt.description}</p>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="font-medium">{evt.venue}, {evt.city}, {evt.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span>{new Date(evt.start_date).toLocaleDateString()} — {new Date(evt.end_date).toLocaleDateString()}</span>
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
                    2 Halls Configured
                  </span>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    12 Stands Allocated
                  </span>
                </div>

                <Button size="sm" variant="outline" className="text-xs h-7 font-bold hover:border-brand-300 hover:text-brand-700">
                  Manage Floorplan
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
            <Button type="submit" variant="primary" className="flex-1 font-bold">
              Save Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
