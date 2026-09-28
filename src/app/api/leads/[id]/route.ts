import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_LEADS, INITIAL_NOTES, INITIAL_FOLLOWUPS } from '@/lib/data/mock-store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lead = INITIAL_LEADS.find((l) => l.id === params.id || l.local_id === params.id);
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const notes = INITIAL_NOTES.filter((n) => n.lead_id === lead.id);
  const followups = INITIAL_FOLLOWUPS.filter((f) => f.lead_id === lead.id);

  return NextResponse.json({
    lead,
    notes,
    followups,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadIndex = INITIAL_LEADS.findIndex((l) => l.id === params.id || l.local_id === params.id);
    if (leadIndex === -1) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updates = await req.json();
    INITIAL_LEADS[leadIndex] = {
      ...INITIAL_LEADS[leadIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      lead: INITIAL_LEADS[leadIndex],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
