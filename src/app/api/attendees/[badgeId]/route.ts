import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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

  try {
    const supabase = createServerClient();
    const { data: dbAtt } = await supabase
      .from('attendees')
      .select('*')
      .or(`badge_id.ilike.${cleanId},qr_token.eq.${cleanId},qr_token.eq.lead2b:badge:${cleanId}`)
      .maybeSingle();

    if (dbAtt) {
      return NextResponse.json({ attendee: dbAtt });
    }
  } catch (e) {
    console.warn('API attendee lookup database query error:', e);
  }

  // Demo fallback check
  const isDemo = req.nextUrl.searchParams.get('demo') === 'true' || cleanId.startsWith('GITEX2026-ATT-');
  if (isDemo) {
    const attendee = INITIAL_ATTENDEES.find(
      (a) =>
        a.badge_id.toLowerCase() === cleanId.toLowerCase() ||
        a.qr_token.toLowerCase() === cleanId.toLowerCase() ||
        a.qr_token.toLowerCase() === `lead2b:badge:${cleanId.toLowerCase()}`
    );

    if (attendee) {
      return NextResponse.json({ attendee });
    }
  }

  return NextResponse.json({ error: 'Attendee not found' }, { status: 404 });
}
