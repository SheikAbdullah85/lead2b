import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ATTENDEES } from '@/lib/data/mock-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim().toLowerCase();
  const eventId = searchParams.get('event_id');

  if (!q) {
    return NextResponse.json({ attendees: [] });
  }

  let attendees = INITIAL_ATTENDEES;
  if (eventId) {
    attendees = attendees.filter((a) => a.event_id === eventId);
  }

  const matched = attendees.filter(
    (a) =>
      a.badge_id.toLowerCase().includes(q) ||
      (a.registration_id && a.registration_id.toLowerCase().includes(q)) ||
      a.email.toLowerCase().includes(q) ||
      (a.mobile && a.mobile.includes(q)) ||
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
      (a.company && a.company.toLowerCase().includes(q))
  );

  return NextResponse.json({
    attendees: matched,
    total: matched.length,
  });
}
