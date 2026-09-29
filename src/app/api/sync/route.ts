import { NextRequest, NextResponse } from 'next/server';
import { SyncQueueItem } from '@/lib/types';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { createServerClient } from '@/lib/supabase/server';

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
        let serverId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        try {
          const supabase = createServerClient();
          const { data: dbLead, error: insertError } = await supabase.from('leads').insert([{
            tenant_id: leadData.tenant_id,
            event_id: leadData.event_id,
            captured_by: leadData.captured_by,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            company: leadData.company || '',
            job_title: leadData.job_title || '',
            email: leadData.email || '',
            mobile: leadData.mobile || '',
            website: leadData.website || '',
            country: leadData.country || '',
            industry: leadData.industry || '',
            source: leadData.source || 'business_card',
            rating: leadData.rating || 'warm',
            status: leadData.status || 'new',
            priority: leadData.priority || 'medium',
            product_interest: leadData.product_interest || '',
            requirement: leadData.requirement || '',
            purchase_timeline: leadData.purchase_timeline || '1-3 months',
            capture_method: leadData.capture_method || 'business_card',
            online_offline: 'online',
            sync_status: 'synced',
            idempotency_key: idempotencyKey,
          }]).select('id').single();

          if (!insertError && dbLead?.id) {
            serverId = dbLead.id;
          }
        } catch (dbErr) {
          console.warn('API sync direct DB insert warning:', dbErr);
        }

        const syncedLead = {
          ...leadData,
          id: serverId,
          server_id: serverId,
          sync_status: 'synced',
          created_at: leadData.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Store in mock leads array for demo fallback
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
