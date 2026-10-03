'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandingSettings } from '../types';
import { DEFAULT_LIVE_TENANT } from '../events/active-event';

const DEFAULT_BRANDING: BrandingSettings = {
  id: 'brand_craftix',
  tenant_id: DEFAULT_LIVE_TENANT.id,
  company_name: DEFAULT_LIVE_TENANT.name,
  primary_color: '#00838f',
  secondary_color: '#0f172a',
  welcome_message: `Welcome to ${DEFAULT_LIVE_TENANT.name} Exhibition Stand`,
};

interface BrandingContextType {
  branding: BrandingSettings;
  updateBranding: (newBranding: Partial<BrandingSettings>) => void;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  updateBranding: () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);

  useEffect(() => {
    // 1. Check custom saved branding
    try {
      const stored = localStorage.getItem('lead2b_tenant_branding');
      if (stored) {
        setBranding(JSON.parse(stored));
        return;
      }

      // 2. Check registered exhibitors in localStorage
      const storedEx = localStorage.getItem('lead2b_exhibitors');
      if (storedEx) {
        const orgs = JSON.parse(storedEx);
        const match = orgs.find((o: any) => o.company_name?.toLowerCase().includes('craftix')) || orgs[0];
        if (match) {
          setBranding({
            id: `brand_${match.id}`,
            tenant_id: match.id,
            company_name: match.company_name,
            primary_color: '#00838f',
            secondary_color: '#0f172a',
            welcome_message: `Welcome to ${match.company_name} Stand`,
          });
        }
      }
    } catch (e) {}
  }, []);

  const updateBranding = (newBranding: Partial<BrandingSettings>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...newBranding };
      localStorage.setItem('lead2b_tenant_branding', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
