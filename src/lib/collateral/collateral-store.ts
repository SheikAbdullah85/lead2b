import { CollateralAsset, CollateralDispatch, Lead, UserProfile } from '../types';

export const DEFAULT_COLLATERAL_ASSETS: CollateralAsset[] = [
  {
    id: 'col_001',
    title: 'Enterprise AI Platform Architecture Whitepaper',
    category: 'whitepaper',
    file_name: 'Enterprise_AI_Architecture_v4.2.pdf',
    file_size: '4.2 MB',
    download_url: 'https://assets.lead2b.io/collateral/Enterprise_AI_Architecture_v4.2.pdf',
    description: 'Technical architecture, on-prem & sovereign cloud deployment topology, and LLM orchestration benchmarks.',
    thumbnail_icon: '📄',
  },
  {
    id: 'col_002',
    title: 'GITEX 2026 Special Pricing & License Matrix',
    category: 'pricing',
    file_name: 'GITEX_2026_Enterprise_Pricing.pdf',
    file_size: '1.8 MB',
    download_url: 'https://assets.lead2b.io/collateral/GITEX_2026_Enterprise_Pricing.pdf',
    description: 'Comprehensive volume licensing, booth discounts, multi-seat pricing, and annual maintenance plans.',
    thumbnail_icon: '📊',
  },
  {
    id: 'col_003',
    title: 'Healthcare & Enterprise Cloud Transformation Case Study',
    category: 'case_study',
    file_name: 'Cleveland_Clinic_Transformation_Study.pdf',
    file_size: '3.1 MB',
    download_url: 'https://assets.lead2b.io/collateral/Cleveland_Clinic_Transformation_Study.pdf',
    description: 'Real-world deployment metrics showing 4x faster patient diagnostics and sovereign data compliance.',
    thumbnail_icon: '🏥',
  },
  {
    id: 'col_004',
    title: 'Cybersecurity, UAE Sovereign Cloud & Compliance Brief',
    category: 'brochure',
    file_name: 'UAE_Cybersecurity_Compliance_Brief.pdf',
    file_size: '2.4 MB',
    download_url: 'https://assets.lead2b.io/collateral/UAE_Cybersecurity_Compliance_Brief.pdf',
    description: 'NESA, Dubai ISR, and ISO 27001 regulatory compliance guidelines and zero-trust safeguards.',
    thumbnail_icon: '🛡️',
  },
];

// In-memory / local storage dispatches cache for demo & offline tracking
const inMemoryDispatches: CollateralDispatch[] = [];

export async function dispatchCollateralToLead(params: {
  leadId: string;
  leadEmail: string;
  leadName: string;
  assetIds: string[];
  sentByUserId?: string;
  sentByName?: string;
}): Promise<CollateralDispatch> {
  const selectedAssets = DEFAULT_COLLATERAL_ASSETS.filter((a) => params.assetIds.includes(a.id));
  
  const dispatch: CollateralDispatch = {
    id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    lead_id: params.leadId,
    lead_email: params.leadEmail,
    lead_name: params.leadName,
    asset_ids: params.assetIds,
    asset_titles: selectedAssets.map((a) => a.title),
    dispatch_status: 'sent',
    dispatched_at: new Date().toISOString(),
    sent_by_user_id: params.sentByUserId || 'staff_tariq',
    sent_by_name: params.sentByName || 'Tariq Mansoor',
  };

  inMemoryDispatches.unshift(dispatch);

  // If online, dispatch asynchronously to the fulfillment API endpoint
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      fetch('/api/collateral/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dispatch),
      }).catch((err) => console.warn('Background collateral dispatch API error:', err));
    } catch (e) {}
  }

  return dispatch;
}

export function getDispatchesForLead(leadId: string): CollateralDispatch[] {
  return inMemoryDispatches.filter((d) => d.lead_id === leadId);
}
