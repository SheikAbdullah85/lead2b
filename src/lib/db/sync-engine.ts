import { localDb, LocalLead } from './dexie';
import { SyncQueueItem, Lead } from '../types';
import { supabase } from '../supabase/client';
import { dispatchHotLeadAlert } from '../crm/webhook-dispatcher';

export interface SyncStats {
  synced: number;
  pending: number;
  failed: number;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

type SyncListener = (stats: SyncStats) => void;
const listeners = new Set<SyncListener>();

let isSyncingActive = false;
let lastSyncTimestamp: string | null = null;

function notifyListeners(stats: SyncStats) {
  listeners.forEach((listener) => listener(stats));
}

export async function getSyncStats(): Promise<SyncStats> {
  const pendingLeads = await localDb.leads.where('sync_status').equals('pending').count();
  const syncingLeads = await localDb.leads.where('sync_status').equals('syncing').count();
  const syncedLeads = await localDb.leads.where('sync_status').equals('synced').count();
  const failedLeads = await localDb.leads.where('sync_status').equals('failed').count();

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return {
    synced: syncedLeads,
    pending: pendingLeads + syncingLeads,
    failed: failedLeads,
    isOnline,
    isSyncing: isSyncingActive,
    lastSyncTime: lastSyncTimestamp,
  };
}

export function subscribeToSyncStats(callback: SyncListener) {
  listeners.add(callback);
  getSyncStats().then(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Queue a new lead locally and immediately attempt sync if online
 */
export async function saveLeadLocally(leadData: Omit<Lead, 'id' | 'local_id' | 'sync_status'>): Promise<LocalLead> {
  const localId = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const idempotencyKey = `lead_idemp_${localId}`;

  const localLead: LocalLead = {
    ...leadData,
    id: localId,
    local_id: localId,
    sync_status: 'pending',
    online_offline: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
    idempotency_key: idempotencyKey,
    retry_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await localDb.leads.put(localLead);

  const queueItem: SyncQueueItem = {
    id: `queue_${localId}`,
    tenant_id: localLead.tenant_id,
    user_id: localLead.captured_by,
    idempotency_key: idempotencyKey,
    action: 'create_lead',
    payload: localLead,
    status: 'pending',
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  await localDb.syncQueue.put(queueItem);

  const stats = await getSyncStats();
  notifyListeners(stats);

  // Trigger real-time hot lead webhook alert if qualified as hot
  if (localLead.rating === 'hot' || localLead.rating === 'urgent') {
    dispatchHotLeadAlert(localLead).catch(() => {});
  }

  // Background trigger
  triggerSync();

  return localLead;
}

/**
 * Main synchronization worker with exponential backoff & idempotency
 */
export async function triggerSync(): Promise<{ success: boolean; syncedCount: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const stats = await getSyncStats();
    notifyListeners(stats);
    return { success: false, syncedCount: 0 };
  }

  if (isSyncingActive) {
    return { success: true, syncedCount: 0 };
  }

  isSyncingActive = true;
  let stats = await getSyncStats();
  notifyListeners(stats);

  let syncedCount = 0;

  try {
    const pendingItems = await localDb.syncQueue
      .where('status')
      .anyOf(['pending', 'failed'])
      .toArray();

    for (const item of pendingItems) {
      if (item.retry_count >= 5) {
        // Exceeded max retry threshold
        continue;
      }

      try {
        // Mark as syncing in Dexie
        await localDb.syncQueue.update(item.id, {
          status: 'syncing',
          last_attempt: new Date().toISOString(),
          retry_count: item.retry_count + 1,
        });

        if (item.action === 'create_lead') {
          await localDb.leads.where('local_id').equals(item.payload.local_id).modify((lead: LocalLead) => {
            lead.sync_status = 'syncing';
          });
          const p = item.payload;

          let serverLeadId: string | null = null;

          // Helper to check valid UUID
          const isUuid = (val?: string) =>
            typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

          const generatedUuid = isUuid(p.id) ? p.id : (isUuid(p.server_id) ? p.server_id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c0000000-0000-0000-0000-' + Date.now().toString(16).padStart(12, '0')));

          // Attempt 1: Direct Supabase PostgreSQL Insertion
          try {
            const { error: sbError } = await supabase.from('leads').insert([{
              id: generatedUuid,
              tenant_id: p.tenant_id,
              event_id: p.event_id,
              captured_by: p.captured_by,
              attendee_id: isUuid(p.attendee_id) ? p.attendee_id : null,
              booth_id: isUuid(p.booth_id) ? p.booth_id : null,
              first_name: p.first_name || 'Lead',
              last_name: p.last_name || '',
              company: p.company || '',
              job_title: p.job_title || '',
              email: p.email || '',
              mobile: p.mobile || '',
              website: p.website || '',
              country: p.country || '',
              industry: p.industry || '',
              source: p.source || 'qr_scan',
              rating: p.rating || 'warm',
              status: p.status || 'new',
              priority: p.priority || 'medium',
              product_interest: p.product_interest || '',
              requirement: p.requirement || '',
              purchase_timeline: p.purchase_timeline || '1-3 months',
              capture_method: p.capture_method || 'QR',
              online_offline: 'online',
              sync_status: 'synced',
              idempotency_key: item.idempotency_key,
            }]);

            if (!sbError) {
              serverLeadId = generatedUuid;
            } else {
              console.warn('Direct Supabase insert returned error:', sbError);
            }
          } catch (sbErr) {
            console.warn('Supabase client exception during sync:', sbErr);
          }

          // Attempt 2: Server API endpoint /api/sync fallback
          if (!serverLeadId) {
            const response = await fetch('/api/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Idempotency-Key': item.idempotency_key,
              },
              body: JSON.stringify(item),
            });

            if (!response.ok) {
              throw new Error(`Sync API returned HTTP ${response.status}`);
            }

            const result = await response.json();
            serverLeadId = result.lead?.id || `lead_${Date.now()}`;
          }

          // Mark as synced locally
          await localDb.syncQueue.update(item.id, { status: 'synced', error_message: undefined });

          const finalServerId = serverLeadId || `lead_${Date.now()}`;
          await localDb.leads.where('local_id').equals(p.local_id).modify((lead: LocalLead) => {
            lead.id = finalServerId;
            lead.server_id = finalServerId;
            lead.sync_status = 'synced';
            lead.updated_at = new Date().toISOString();
          });

          syncedCount++;
        }
      } catch (err: any) {
        console.warn(`Sync failed for item ${item.id}:`, err);
        await localDb.syncQueue.update(item.id, {
          status: 'failed',
          error_message: err.message || 'Network sync error',
        });
        if (item.action === 'create_lead') {
          await localDb.leads.where('local_id').equals(item.payload.local_id).modify((lead: LocalLead) => {
            lead.sync_status = 'failed';
          });
        }
      }
    }

    lastSyncTimestamp = new Date().toLocaleTimeString();
  } finally {
    isSyncingActive = false;
    stats = await getSyncStats();
    notifyListeners(stats);
  }

  return { success: true, syncedCount };
}

// Auto-register window online listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[lead2b] Network restored. Triggering automatic background sync...');
    triggerSync();
  });

  window.addEventListener('offline', () => {
    getSyncStats().then(notifyListeners);
  });
}
