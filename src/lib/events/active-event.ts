'use client';

import { Event, Organization } from '@/lib/types';
import { INITIAL_EVENTS } from '@/lib/data/mock-store';

export interface ActiveEventInfo {
  id: string;
  name: string;
  code: string;
  venue: string;
  city: string;
}

export interface ActiveTenantInfo {
  id: string;
  name: string;
  code: string;
  stand: string;
}

// Fallback defaults grounded in live Supabase database records
export const DEFAULT_LIVE_EVENT: ActiveEventInfo = {
  id: '0d8c44ff-3163-4265-9e6b-a1b7a5880fc4',
  name: 'Tent Kotta',
  code: 'TEN1210',
  venue: 'Maharnombu Pottal',
  city: 'Karaikkudi',
};

export const DEFAULT_LIVE_TENANT: ActiveTenantInfo = {
  id: '2d14ae23-567f-457f-be97-f8cfb1bbd6dd',
  name: 'Craftix Technologies',
  code: 'CRT2324',
  stand: 'Stand TK-01',
};

/**
 * Returns the currently active exhibition event.
 * Checks localStorage first, then falls back to registered events or Tent Kotta.
 */
export function getActiveEvent(): ActiveEventInfo {
  if (typeof window !== 'undefined') {
    try {
      const activeId = localStorage.getItem('lead2b_active_event_id');
      const stored = localStorage.getItem('lead2b_events');
      if (stored) {
        const events: Event[] = JSON.parse(stored);
        if (activeId) {
          const match = events.find((e) => e.id === activeId);
          if (match) {
            return {
              id: match.id,
              name: match.event_name,
              code: match.event_code,
              venue: match.venue || 'Maharnombu Pottal',
              city: match.city || 'Karaikkudi',
            };
          }
        }
        if (events.length > 0) {
          return {
            id: events[0].id,
            name: events[0].event_name,
            code: events[0].event_code,
            venue: events[0].venue || 'Maharnombu Pottal',
            city: events[0].city || 'Karaikkudi',
          };
        }
      }
    } catch (e) {}
  }
  return DEFAULT_LIVE_EVENT;
}

/**
 * Returns the active exhibitor tenant information (defaults to Craftix Technologies).
 */
export function getActiveTenant(): ActiveTenantInfo {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('lead2b_exhibitors');
      if (stored) {
        const orgs: Organization[] = JSON.parse(stored);
        const craftix = orgs.find((o) => o.company_name?.toLowerCase().includes('craftix')) || orgs[0];
        if (craftix) {
          return {
            id: craftix.id,
            name: craftix.company_name,
            code: craftix.company_code,
            stand: craftix.assigned_stand || 'Stand TK-01',
          };
        }
      }
    } catch (e) {}
  }
  return DEFAULT_LIVE_TENANT;
}
