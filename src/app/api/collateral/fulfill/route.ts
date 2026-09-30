import { NextRequest, NextResponse } from 'next/server';
import { CollateralDispatch } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const dispatch: CollateralDispatch = await req.json();

    if (!dispatch.lead_email || !dispatch.asset_ids || dispatch.asset_ids.length === 0) {
      return NextResponse.json(
        { error: 'Lead email and at least one asset ID are required.' },
        { status: 400 }
      );
    }

    // In production, this calls SendGrid, Postmark, or AWS SES with trackable links.
    // We log the fulfillment and return simulated delivery confirmation.
    console.log(`[Fulfillment] Instant digital collateral dispatched to: ${dispatch.lead_email} (${dispatch.asset_titles.join(', ')})`);

    const result = {
      success: true,
      message: `Automated email dispatched to ${dispatch.lead_email} with ${dispatch.asset_ids.length} collateral asset(s).`,
      dispatchId: dispatch.id,
      timestamp: new Date().toISOString(),
      provider: 'SendGrid/Postmark Transactional Engine',
      delivered: true,
    };

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Collateral fulfillment failed' },
      { status: 500 }
    );
  }
}
