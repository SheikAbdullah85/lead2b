import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { INITIAL_ATTENDEES } from '@/lib/data/mock-store';
import { Attendee } from '@/lib/types';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase();
  const eventId = searchParams.get('event_id');
  const isDemo = searchParams.get('demo') === 'true';

  if (!q) {
    return NextResponse.json({ attendees: [], total: 0 });
  }

  try {
    const supabase = createServerClient();
    let query = supabase.from('attendees').select('*');
    if (eventId) query = query.eq('event_id', eventId);
    const { data: dbAtts } = await query;

    let sourceList: Attendee[] = (dbAtts && dbAtts.length > 0) ? (dbAtts as Attendee[]) : [];

    if (sourceList.length === 0 && isDemo) {
      sourceList = INITIAL_ATTENDEES;
      if (eventId) {
        sourceList = sourceList.filter((a) => a.event_id === eventId);
      }
    }

    const matched = sourceList.filter(
      (a) =>
        a.badge_id?.toLowerCase().includes(q) ||
        (a.registration_id && a.registration_id.toLowerCase().includes(q)) ||
        a.email?.toLowerCase().includes(q) ||
        (a.mobile && a.mobile.includes(q)) ||
        `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().includes(q) ||
        (a.company && a.company.toLowerCase().includes(q))
    );

    return NextResponse.json({
      attendees: matched,
      total: matched.length,
    });
  } catch (err: any) {
    return NextResponse.json({ attendees: [], total: 0 });
  }
}
