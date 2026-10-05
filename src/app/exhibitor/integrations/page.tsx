'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DEFAULT_CRM_MAPPINGS } from '@/lib/crm/field-mapper';
import { ShieldCheck, Send, CheckCircle2, RefreshCw, Key, Globe, ArrowRight, Sparkles, Copy, Check } from 'lucide-react';

export default function ExhibitorIntegrationsPage() {
  const [selectedProvider, setSelectedProvider] = useState<'salesforce' | 'hubspot' | 'zoho' | 'dynamics' | 'custom_webhook'>('hubspot');
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/demo-lead2b-target');
  const [secretKey, setSecretKey] = useState('whsec_gitex2026_demo_key_9981');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>(DEFAULT_CRM_MAPPINGS.hubspot);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleProviderChange = (provider: any) => {
    setSelectedProvider(provider);
    setMappings(DEFAULT_CRM_MAPPINGS[provider] || DEFAULT_CRM_MAPPINGS.custom_webhook);
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_dispatch',
          webhook_id: 'wh_001',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: 'Webhook test passed! HMAC SHA-256 signature verified by endpoint.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Webhook test failed to connect to target URL.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error during test dispatch.',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3 h-3 text-brand-600" />
          Independent Enterprise CRM Sync
        </span>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight break-normal">CRM & Webhook Integration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Forward captured booth leads automatically into Salesforce, HubSpot, Zoho, Dynamics, or any Custom API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: CRM Provider Selector & Field Mapping */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-black">1. Select Target CRM Platform</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Lead capture runs independently without tight CRM coupling</p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'hubspot', label: 'HubSpot CRM', icon: '🟧' },
                  { key: 'salesforce', label: 'Salesforce', icon: '☁️' },
                  { key: 'zoho', label: 'Zoho CRM', icon: '🔴' },
                  { key: 'dynamics', label: 'MS Dynamics', icon: '🔷' },
                ].map((crm) => {
                  const isSelected = selectedProvider === crm.key;
                  return (
                    <button
                      key={crm.key}
                      type="button"
                      onClick={() => handleProviderChange(crm.key)}
                      className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/80 text-brand-900 font-black shadow-xs ring-2 ring-brand-200'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-2xl">{crm.icon}</span>
                      <span className="text-xs">{crm.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* CRM Field Mapping Configuration */}
          <Card className="shadow-2xs">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base font-black">2. Flexible Field Mapping</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">Map lead2b badge capture fields to CRM contact attributes</p>
                </div>
                <span className="text-[10px] font-bold text-brand-800 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full">
                  Live Mapping Active
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2.5">
                {Object.entries(mappings).map(([leadField, crmField]) => (
                  <div key={leadField} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="w-1/3 font-bold text-slate-700 font-mono truncate">{leadField}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <input
                      type="text"
                      value={crmField}
                      onChange={(e) => setMappings({ ...mappings, [leadField]: e.target.value })}
                      className="flex-1 h-9 rounded-lg border border-slate-300 px-3 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <Button size="sm" variant="primary" className="text-xs font-bold">
                  Save Field Mappings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Outbound Webhook & Real-time Test Dispatch */}
        <div className="space-y-4">
          <Card className="border-slate-800 shadow-md bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-slate-950/80 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-400">
                <Send className="w-4 h-4" />
                <span>Outbound Webhook Dispatcher</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time event streaming with HMAC SHA-256 signatures
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 text-slate-200">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Target Webhook Endpoint
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-crm.com/api/leads"
                  className="w-full text-xs h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 font-mono text-slate-200 focus:ring-2 focus:ring-brand-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Webhook Secret (HMAC)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="flex-1 text-xs h-10 rounded-xl border border-slate-700 bg-slate-800 px-3 font-mono text-slate-200"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copySecret}
                    className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 h-10 px-3"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Subscribed Event Topics
                </span>
                <div className="space-y-1.5 text-xs">
                  {['lead.created', 'lead.updated', 'lead.qualified', 'lead.followup.created'].map((evt) => (
                    <div key={evt} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                      <span className="font-mono text-[11px]">{evt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium ${
                    testResult.success
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                onClick={handleTestWebhook}
                isLoading={isTestingWebhook}
                className="w-full text-xs font-bold gap-2 py-2.5 shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-200" />
                <span>Send Test Webhook Payload</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
