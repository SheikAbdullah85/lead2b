import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!lead || error) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { data: notes } = await supabase.from('lead_notes').select('*').eq('lead_id', params.id);
    const { data: followups } = await supabase.from('followups').select('*').eq('lead_id', params.id);

    return NextResponse.json({
      lead,
      notes: notes || [],
      followups: followups || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await req.json();
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      lead: data,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();

    // 1. Cascade delete child notes and followups
    await supabase.from('lead_notes').delete().eq('lead_id', params.id);
    await supabase.from('followups').delete().eq('lead_id', params.id);

    // 2. Delete parent lead record
    const { error } = await supabase.from('leads').delete().eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deleted_id: params.id,
      message: 'Lead and associated child records successfully deleted.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
