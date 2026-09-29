import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ATTENDEES } from '@/lib/data/mock-store';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { badgeId: string } }
) {
  let cleanId = decodeURIComponent(params.badgeId).trim();

  // Strip token prefix if formatted as lead2b:badge:XYZ
  if (cleanId.startsWith('lead2b:badge:')) {
    cleanId = cleanId.replace('lead2b:badge:', '');
  }

  const attendee = INITIAL_ATTENDEES.find(
    (a) =>
      a.badge_id.toLowerCase() === cleanId.toLowerCase() ||
      a.qr_token.toLowerCase() === cleanId.toLowerCase()
  );

  if (!attendee) {
    return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
  }

  return NextResponse.json({ attendee });
}
