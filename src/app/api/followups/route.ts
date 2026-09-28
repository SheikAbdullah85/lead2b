import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_FOLLOWUPS } from '@/lib/data/mock-store';
import { FollowupTask } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenant_id');
  const assignedTo = searchParams.get('assigned_to');
  const status = searchParams.get('status');

  let tasks = [...INITIAL_FOLLOWUPS];

  if (tenantId) {
    tasks = tasks.filter((t) => t.tenant_id === tenantId);
  }
  if (assignedTo) {
    tasks = tasks.filter((t) => t.assigned_to === assignedTo);
  }
  if (status && status !== 'all') {
    tasks = tasks.filter((t) => t.status === status);
  }

  return NextResponse.json({
    followups: tasks,
    total: tasks.length,
  });
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

    const newTask: FollowupTask = {
      id: `foll_${Date.now()}`,
      tenant_id: body.tenant_id || '11111111-1111-1111-1111-111111111111',
      event_id: body.event_id || 'eeee1111-1111-1111-1111-111111111111',
      lead_id: body.lead_id,
      lead_name: body.lead_name || 'Prospect Lead',
      lead_company: body.lead_company,
      lead_mobile: body.lead_mobile,
      lead_email: body.lead_email,
      assigned_to: body.assigned_to,
      assigned_to_name: body.assigned_to_name,
      task_type: body.task_type || 'call',
      task_title: body.task_title,
      description: body.description || '',
      due_date: body.due_date,
      priority: body.priority || 'medium',
      status: 'open',
      created_by: body.created_by || 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      created_at: new Date().toISOString(),
      sync_status: 'synced',
    };

    INITIAL_FOLLOWUPS.unshift(newTask);

    return NextResponse.json({ success: true, followup: newTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
