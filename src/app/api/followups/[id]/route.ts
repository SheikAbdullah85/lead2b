import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_FOLLOWUPS } from '@/lib/data/mock-store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskIndex = INITIAL_FOLLOWUPS.findIndex((f) => f.id === params.id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: 'Followup task not found' }, { status: 404 });
    }

    const updates = await req.json();
    INITIAL_FOLLOWUPS[taskIndex] = {
      ...INITIAL_FOLLOWUPS[taskIndex],
      ...updates,
      completed_at: updates.status === 'completed' ? new Date().toISOString() : undefined,
    };

    return NextResponse.json({
      success: true,
      followup: INITIAL_FOLLOWUPS[taskIndex],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
