'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBranding } from '@/lib/branding/context';
import { getActiveEvent, getActiveTenant } from '@/lib/events/active-event';
import { Palette, CheckCircle2, Sparkles, Building2, Sliders, Eye } from 'lucide-react';

export default function ExhibitorSettingsPage() {
  const { branding, updateBranding } = useBranding();
  const activeEvent = getActiveEvent();
  const activeTenant = getActiveTenant();

  const [companyName, setCompanyName] = useState(branding.company_name || activeTenant.name);
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color || '#00838f');
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color || '#1e293b');
  const [welcomeMessage, setWelcomeMessage] = useState(
    branding.welcome_message || `Welcome to ${activeTenant.name} at ${activeEvent.name}`
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBranding({
      company_name: companyName,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      welcome_message: welcomeMessage,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
          <Palette className="w-3 h-3 text-brand-600" />
          Multi-Tenant White-Labeling
        </span>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight break-normal">Tenant Customization</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize company identity, brand palette, and personalized welcome messaging on mobile capture screens.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="shadow-2xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base font-black">Company Identity & Messaging</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Visible to sales reps and visitors upon badge scan</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <Input
              label="Exhibitor Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Booth Welcome Message
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-xl border border-slate-300 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 text-slate-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Theme Colors */}
        <Card className="shadow-2xs">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-600" />
              <CardTitle className="text-base font-black">Brand Colors (White-Label)</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dynamically themes buttons, headers, scanner brackets, and badge accents in mobile PWA
            </p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-32 h-11 rounded-xl border border-slate-300 px-3 font-mono text-xs uppercase text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-32 h-11 rounded-xl border border-slate-300 px-3 font-mono text-xs uppercase text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Quick Live Preview Bar */}
            <div className="p-4 rounded-2xl border border-slate-200 mt-4 bg-slate-50 space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-brand-600" />
                Live Dynamic Button & Header Preview:
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  style={{ backgroundColor: primaryColor }}
                  className="px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md active:scale-95 transition"
                >
                  SCAN LEAD (Primary CTA)
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: secondaryColor }}
                  className="px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md active:scale-95 transition"
                >
                  Secondary Action
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {savedSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>White-label settings updated and applied across all tenant booth devices!</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" className="font-bold py-3">
            Save Branding Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
