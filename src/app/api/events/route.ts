import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_EVENTS } from '@/lib/data/mock-store';
import { Event } from '@/lib/types';

export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({
    events: INITIAL_EVENTS,
    total: INITIAL_EVENTS.length,
  });
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

    const newEvent: Event = {
      id: `ev_${Date.now()}`,
      event_name: body.event_name,
      event_code: body.event_code.toUpperCase(),
      description: body.description || '',
      venue: body.venue || '',
      city: body.city || '',
      country: body.country || '',
      start_date: body.start_date,
      end_date: body.end_date,
      organizer_name: body.organizer_name || 'Exhibition Authority',
      status: body.status || 'active',
      timezone: body.timezone || 'UTC+04:00',
      allow_offline_attendee_download: body.allow_offline_attendee_download ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    INITIAL_EVENTS.unshift(newEvent);

    return NextResponse.json({ success: true, event: newEvent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
