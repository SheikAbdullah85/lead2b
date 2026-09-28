import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { Lead } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const eventId = searchParams.get('event_id');
  const capturedBy = searchParams.get('captured_by');
  const rating = searchParams.get('rating');
  const status = searchParams.get('status');
  const query = searchParams.get('search')?.toLowerCase();

  let results = [...INITIAL_LEADS];

  if (tenantId) {
    results = results.filter((l) => l.tenant_id === tenantId);
  }
  if (eventId) {
    results = results.filter((l) => l.event_id === eventId);
  }
  if (capturedBy) {
    results = results.filter((l) => l.captured_by === capturedBy);
  }
  if (rating && rating !== 'all') {
    results = results.filter((l) => l.rating === rating);
  }
  if (status && status !== 'all') {
    results = results.filter((l) => l.status === status);
  }
  if (query) {
    results = results.filter((l) =>
      `${l.first_name} ${l.last_name} ${l.company} ${l.email} ${l.mobile} ${l.product_interest}`
        .toLowerCase()
        .includes(query)
    );
  }

  return NextResponse.json({
    leads: results,
    total: results.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.first_name || !body.last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required.' },
        { status: 400 }
      );
    }

    // Check duplicate attendee or email within the same tenant & event
    const existing = INITIAL_LEADS.find(
      (l) =>
        l.tenant_id === body.tenant_id &&
        l.event_id === body.event_id &&
        ((body.attendee_id && l.attendee_id === body.attendee_id) ||
          (body.email && l.email?.toLowerCase() === body.email.toLowerCase()))
    );

    if (existing) {
      return NextResponse.json(
        {
          duplicate: true,
          message: 'This visitor has already been captured.',
          existingLead: existing,
        },
        { status: 409 }
      );
    }

    const newLead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: body.tenant_id || '11111111-1111-1111-1111-111111111111',
      event_id: body.event_id || 'eeee1111-1111-1111-1111-111111111111',
      attendee_id: body.attendee_id,
      captured_by: body.captured_by || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      captured_by_name: body.captured_by_name || 'Tariq Mansoor',
      booth_id: body.booth_id || 'b0001111-1111-1111-1111-111111111111',
      first_name: body.first_name,
      last_name: body.last_name,
      full_name: `${body.first_name} ${body.last_name}`,
      company: body.company || '',
      job_title: body.job_title || '',
      email: body.email || '',
      mobile: body.mobile || '',
      country: body.country || '',
      industry: body.industry || '',
      source: body.source || 'qr_scan',
      rating: body.rating || 'warm',
      status: body.status || 'new',
      priority: body.priority || 'medium',
      product_interest: body.product_interest || '',
      requirement: body.requirement || '',
      estimated_value: Number(body.estimated_value) || 0,
      purchase_timeline: body.purchase_timeline || '1-3 months',
      assigned_to: body.assigned_to || body.captured_by,
      assigned_to_name: body.assigned_to_name || body.captured_by_name,
      followup_required: !!body.followup_required,
      followup_date: body.followup_date,
      capture_method: body.capture_method || 'QR',
      captured_at: new Date().toISOString(),
      online_offline: 'online',
      sync_status: 'synced',
      consent_status: true,
      email_marketing_consent: true,
      privacy_policy_accepted: true,
      consent_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes_count: 0,
      followups_count: body.followup_required ? 1 : 0,
    };

    INITIAL_LEADS.unshift(newLead);

    return NextResponse.json({
      success: true,
      lead: newLead,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
