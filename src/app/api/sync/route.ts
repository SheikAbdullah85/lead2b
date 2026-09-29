import { NextRequest, NextResponse } from 'next/server';
import { SyncQueueItem } from '@/lib/types';
import { INITIAL_LEADS } from '@/lib/data/mock-store';

export const runtime = 'edge';

// In-memory or database sync handler with idempotency protection
const processedIdempotencyKeys = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const item: SyncQueueItem = await req.json();
    const idempotencyKey = req.headers.get('X-Idempotency-Key') || item.idempotency_key;

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Missing X-Idempotency-Key header' }, { status: 400 });
    }

    // Check if already processed (Idempotency guarantee)
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return NextResponse.json({
        status: 'already_processed',
        message: 'Item has already been synchronized previously.',
        idempotencyKey,
      });
    }

    let resultPayload: any = {};

    switch (item.action) {
      case 'create_lead': {
        const leadData = item.payload;
        // Generate permanent server UUID
        const serverId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const syncedLead = {
          ...leadData,
          id: serverId,
          server_id: serverId,
          sync_status: 'synced',
          created_at: leadData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Store in mock leads array for demo persistence
        INITIAL_LEADS.unshift(syncedLead);
        resultPayload = { lead: syncedLead };
        break;
      }

      case 'add_note': {
        resultPayload = { noteId: `note_${Date.now()}`, status: 'synced' };
        break;
      }

      case 'create_followup': {
        resultPayload = { followupId: `foll_${Date.now()}`, status: 'synced' };
        break;
      }

      default:
        resultPayload = { status: 'acknowledged' };
    }

    processedIdempotencyKeys.add(idempotencyKey);

    return NextResponse.json({
      success: true,
      idempotencyKey,
      ...resultPayload,
    });
  } catch (err: any) {
    console.error('API /api/sync error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal sync engine error' },
      { status: 500 }
    );
  }
}
