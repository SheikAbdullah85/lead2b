import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_LEADS } from '@/lib/data/mock-store';
import { Lead } from '@/lib/types';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const eventId = searchParams.get('event_id');
  const capturedBy = searchParams.get('captured_by');
  const rating = searchParams.get('rating');
  const status = searchParams.get('status');
  const query = searchParams.get('search')?.toLowerCase();

  try {
    const supabase = createServerClient();
    let dbQuery = supabase.from('leads').select('*').order('created_at', { ascending: false });

    if (tenantId) dbQuery = dbQuery.eq('tenant_id', tenantId);
    if (eventId) dbQuery = dbQuery.eq('event_id', eventId);
    if (capturedBy) dbQuery = dbQuery.eq('captured_by', capturedBy);
    if (rating && rating !== 'all') dbQuery = dbQuery.eq('rating', rating);
    if (status && status !== 'all') dbQuery = dbQuery.eq('status', status);

    const { data: dbLeads, error: dbError } = await dbQuery;

    let results: Lead[] = (dbLeads && dbLeads.length > 0) ? (dbLeads as Lead[]) : [...INITIAL_LEADS];

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
  } catch (err: any) {
    console.warn('API leads GET fallback to mock:', err);
    return NextResponse.json({
      leads: INITIAL_LEADS,
      total: INITIAL_LEADS.length,
    });
  }
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

    const supabase = createServerClient();

    // Insert directly into Supabase PostgreSQL table 'leads'
    const { data: insertedLead, error: insertError } = await supabase.from('leads').insert([{
      tenant_id: body.tenant_id || '11111111-1111-1111-1111-111111111111',
      event_id: body.event_id || 'eeee1111-1111-1111-1111-111111111111',
      attendee_id: body.attendee_id || null,
      captured_by: body.captured_by || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      booth_id: body.booth_id || null,
      first_name: body.first_name,
      last_name: body.last_name,
      company: body.company || '',
      job_title: body.job_title || '',
      email: body.email || '',
      mobile: body.mobile || '',
      country: body.country || '',
      industry: body.industry || '',
      website: body.website || '',
      source: body.source || 'qr_scan',
      rating: body.rating || 'warm',
      status: body.status || 'new',
      priority: body.priority || 'medium',
      product_interest: body.product_interest || '',
      requirement: body.requirement || '',
      purchase_timeline: body.purchase_timeline || '1-3 months',
      capture_method: body.capture_method || 'QR',
      online_offline: 'online',
      sync_status: 'synced',
      consent_status: true,
      email_marketing_consent: true,
      privacy_policy_accepted: true,
    }]).select().single();

    if (insertError) {
      console.warn('Database insert failed, using memory fallback:', insertError);
    }

    const savedLead: Lead = insertedLead || {
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
      purchase_timeline: body.purchase_timeline || '1-3 months',
      capture_method: body.capture_method || 'QR',
      captured_at: new Date().toISOString(),
      online_offline: 'online',
      sync_status: 'synced',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    INITIAL_LEADS.unshift(savedLead);

    return NextResponse.json({
      success: true,
      lead: savedLead,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
