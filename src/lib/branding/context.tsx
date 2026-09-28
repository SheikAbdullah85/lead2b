'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrandingSettings } from '../types';

const DEFAULT_BRANDING: BrandingSettings = {
  id: 'brand_alpha',
  tenant_id: '11111111-1111-1111-1111-111111111111',
  company_name: 'Alpha Technology Group',
  primary_color: '#2563eb',
  secondary_color: '#1e293b',
  welcome_message: 'Welcome to Alpha Technology GITEX 2026 Stand',
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
    // Load persisted custom branding from local storage if edited in Exhibitor Settings
    try {
      const stored = localStorage.getItem('lead2b_tenant_branding');
      if (stored) {
        setBranding(JSON.parse(stored));
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
