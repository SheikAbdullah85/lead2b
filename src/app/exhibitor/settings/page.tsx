'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBranding } from '@/lib/branding/context';
import { Palette, CheckCircle2, Sparkles, Building2, Sliders } from 'lucide-react';

export default function ExhibitorSettingsPage() {
  const { branding, updateBranding } = useBranding();

  const [companyName, setCompanyName] = useState(branding.company_name || 'Alpha Technology Group');
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color || '#2563eb');
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color || '#1e293b');
  const [welcomeMessage, setWelcomeMessage] = useState(
    branding.welcome_message || 'Welcome to Alpha Technology GITEX 2026 Stand'
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
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">White-Label Branding</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tenant Customization</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize company identity, brand colors, and welcome messages on mobile capture screens.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base">Company Identity & Messaging</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Visible to sales reps and visitors on badge scan</p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <Input
              label="Exhibitor Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Booth Welcome Message
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Theme Colors */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-base">Brand Colors (White-Label)</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly themes buttons, headers, and badge accents in mobile PWA
            </p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Primary Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-32 h-10 rounded-lg border border-slate-300 px-3 font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-32 h-10 rounded-lg border border-slate-300 px-3 font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Quick Live Preview Bar */}
            <div className="p-4 rounded-xl border border-slate-200 mt-4 bg-slate-50 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Live Dynamic Button & Header Preview:
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  style={{ backgroundColor: primaryColor }}
                  className="px-4 py-2 rounded-lg text-white font-bold text-xs shadow-sm transition"
                >
                  SCAN LEAD (Primary CTA)
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: secondaryColor }}
                  className="px-4 py-2 rounded-lg text-white font-bold text-xs shadow-sm transition"
                >
                  Secondary Action
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>White-label settings updated and applied across tenant devices.</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" className="font-bold">
            Save Branding Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
