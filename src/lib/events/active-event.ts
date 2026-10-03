'use client';

import { Event, Organization } from '@/lib/types';
import { INITIAL_EVENTS, INITIAL_EXHIBITORS } from '@/lib/data/mock-store';

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

export const DEFAULT_DEMO_EVENT: ActiveEventInfo = {
  id: 'eeee1111-1111-1111-1111-111111111111',
  name: 'GITEX Global 2026',
  code: 'GITEX2026',
  venue: 'Dubai World Trade Centre (DWTC)',
  city: 'Dubai',
};

export const EMPTY_LIVE_EVENT: ActiveEventInfo = {
  id: '',
  name: 'No Active Event',
  code: 'NONE',
  venue: 'Create an event in Admin Console',
  city: '',
};

export const DEFAULT_DEMO_TENANT: ActiveTenantInfo = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Alpha Technology Group',
  code: 'ALPHA-TECH',
  stand: 'Stand H3-B24',
};

export const EMPTY_LIVE_TENANT: ActiveTenantInfo = {
  id: '',
  name: 'No Tenant Assigned',
  code: 'NONE',
  stand: 'Stand Unassigned',
};

// Aliases for backward compatibility
export const DEFAULT_LIVE_EVENT = EMPTY_LIVE_EVENT;
export const DEFAULT_LIVE_TENANT = EMPTY_LIVE_TENANT;

/**
 * Returns the currently active exhibition event.
 * Checks localStorage first, then resolves according to Demo or Live mode.
 */
export function getActiveEvent(): ActiveEventInfo {
  let isDemo = false;
  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem('lead2b_active_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        isDemo = !!parsed.is_demo;
      }
    } catch (e) {}

    try {
      const rawDel = localStorage.getItem('lead2b_deleted_event_ids');
      const deletedIds = new Set<string>(rawDel ? JSON.parse(rawDel) : []);

      const activeId = localStorage.getItem('lead2b_active_event_id');
      const stored = localStorage.getItem('lead2b_events');
      if (stored) {
        const events: Event[] = JSON.parse(stored).filter((e: Event) => !deletedIds.has(e.id));
        if (activeId && !deletedIds.has(activeId)) {
          const match = events.find((e) => e.id === activeId);
          if (match) {
            return {
              id: match.id,
              name: match.event_name,
              code: match.event_code,
              venue: match.venue || 'Exhibition Centre',
              city: match.city || '',
            };
          }
        }
        if (events.length > 0) {
          return {
            id: events[0].id,
            name: events[0].event_name,
            code: events[0].event_code,
            venue: events[0].venue || 'Exhibition Centre',
            city: events[0].city || '',
          };
        }
      }
    } catch (e) {}
  }
  return isDemo ? DEFAULT_DEMO_EVENT : EMPTY_LIVE_EVENT;
}

/**
 * Returns the active exhibitor tenant information.
 */
export function getActiveTenant(): ActiveTenantInfo {
  let isDemo = false;
  let userTenantId: string | undefined;

  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem('lead2b_active_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        isDemo = !!parsed.is_demo;
        userTenantId = parsed.tenant_id;
      }
    } catch (e) {}

    try {
      const rawDel = localStorage.getItem('lead2b_deleted_exhibitor_ids');
      const deletedIds = new Set<string>(rawDel ? JSON.parse(rawDel) : []);

      const stored = localStorage.getItem('lead2b_exhibitors');
      if (stored) {
        const orgs: Organization[] = JSON.parse(stored).filter((o: Organization) => !deletedIds.has(o.id));
        if (userTenantId) {
          const matchedUserOrg = orgs.find((o) => o.id === userTenantId);
          if (matchedUserOrg) {
            return {
              id: matchedUserOrg.id,
              name: matchedUserOrg.company_name,
              code: matchedUserOrg.company_code,
              stand: matchedUserOrg.assigned_stand || 'Stand Unassigned',
            };
          }
        }
        if (orgs.length > 0) {
          return {
            id: orgs[0].id,
            name: orgs[0].company_name,
            code: orgs[0].company_code,
            stand: orgs[0].assigned_stand || 'Stand Unassigned',
          };
        }
      }
    } catch (e) {}
  }
  return isDemo ? DEFAULT_DEMO_TENANT : EMPTY_LIVE_TENANT;
}
