import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { INITIAL_EVENTS } from '@/lib/data/mock-store';
import { Event } from '@/lib/types';

export const runtime = 'edge';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: dbEvents, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !dbEvents || dbEvents.length === 0) {
      return NextResponse.json({
        events: INITIAL_EVENTS,
        total: INITIAL_EVENTS.length,
      });
    }

    return NextResponse.json({
      events: dbEvents,
      total: dbEvents.length,
    });
  } catch (err: any) {
    return NextResponse.json({
      events: INITIAL_EVENTS,
      total: INITIAL_EVENTS.length,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.event_name || !body.event_code || !body.start_date || !body.end_date) {
      return NextResponse.json(
        { error: 'Missing required event fields (name, code, start_date, end_date)' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const isUuid = (val?: string) =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const generatedId = isUuid(body.id) ? body.id : crypto.randomUUID();

    const insertPayload = {
      id: generatedId,
      event_name: body.event_name.trim(),
      event_code: body.event_code.trim().toUpperCase(),
      description: body.description || '',
      venue: body.venue || 'Dubai World Trade Centre (DWTC)',
      city: body.city || 'Dubai',
      country: body.country || 'United Arab Emirates',
      start_date: body.start_date,
      end_date: body.end_date,
      organizer_name: body.organizer_name || 'Dubai World Trade Centre Authority',
      status: body.status || 'active',
      timezone: body.timezone || 'UTC+04:00',
      allow_offline_attendee_download: body.allow_offline_attendee_download ?? true,
    };

    const { data, error } = await supabase
      .from('events')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, event: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
