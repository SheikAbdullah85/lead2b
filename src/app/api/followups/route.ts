import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { FollowupTask } from '@/lib/types';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const assignedTo = searchParams.get('assigned_to');
  const status = searchParams.get('status');
  const leadId = searchParams.get('lead_id');

  try {
    const supabase = createServerClient();
    let query = supabase.from('followups').select('*').order('created_at', { ascending: false });

    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (leadId) query = query.eq('lead_id', leadId);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data: dbFollowups, error } = await query;

    if (error) {
      console.warn('Error fetching followups from Supabase:', error);
      return NextResponse.json({ followups: [], total: 0 });
    }

    return NextResponse.json({
      followups: dbFollowups || [],
      total: dbFollowups ? dbFollowups.length : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ followups: [], total: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.lead_id || !body.task_title || !body.due_date) {
      return NextResponse.json(
        { error: 'Lead ID, Task Title, and Due Date are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const isUuid = (val?: string) =>
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const generatedId = isUuid(body.id) ? body.id : crypto.randomUUID();

    const insertPayload = {
      id: generatedId,
      tenant_id: isUuid(body.tenant_id) ? body.tenant_id : '2d14ae23-567f-457f-be97-f8cfb1bbd6dd',
      event_id: isUuid(body.event_id) ? body.event_id : '0d8c44ff-3163-4265-9e6b-a1b7a5880fc4',
      lead_id: body.lead_id,
      assigned_to: isUuid(body.assigned_to) ? body.assigned_to : 'd1c88448-0a1a-4b35-8f50-32aea5420067',
      created_by: isUuid(body.created_by) ? body.created_by : 'd1c88448-0a1a-4b35-8f50-32aea5420067',
      task_title: body.task_title,
      task_type: body.task_type || 'call',
      description: body.description || '',
      due_date: body.due_date,
      priority: body.priority || 'medium',
      status: body.status || 'open',
    };

    const { data, error } = await supabase
      .from('followups')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, followup: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
