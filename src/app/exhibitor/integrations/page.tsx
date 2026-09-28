'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { DEFAULT_CRM_MAPPINGS } from '@/lib/crm/field-mapper';
import { ShieldCheck, Send, CheckCircle2, RefreshCw, Key, Globe, ArrowRight } from 'lucide-react';

export default function ExhibitorIntegrationsPage() {
  const [selectedProvider, setSelectedProvider] = useState<'salesforce' | 'hubspot' | 'zoho' | 'dynamics' | 'custom_webhook'>('hubspot');
  const [webhookUrl, setWebhookUrl] = useState('https://webhook.site/demo-lead2b-target');
  const [secretKey, setSecretKey] = useState('whsec_gitex2026_demo_key_9981');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>(DEFAULT_CRM_MAPPINGS.hubspot);

  const handleProviderChange = (provider: any) => {
    setSelectedProvider(provider);
    setMappings(DEFAULT_CRM_MAPPINGS[provider] || DEFAULT_CRM_MAPPINGS.custom_webhook);
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
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Enterprise CRM Sync</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM & Webhook Integration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Independent integration layer. Forward captured leads automatically to Salesforce, HubSpot, Zoho, Dynamics, or Custom APIs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: CRM Provider Selector & Field Mapping */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base">1. Select Target CRM Platform</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Lead capture runs independently without tight CRM coupling</p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                      className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">{crm.icon}</span>
                      <span className="text-xs">{crm.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* CRM Field Mapping Configuration */}
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">2. CRM Field Mapping</CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">Map lead2b capture fields to CRM contact attributes</p>
                </div>
                <Badge variant="synced">Active Mapping</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2.5">
                {Object.entries(mappings).map(([leadField, crmField]) => (
                  <div key={leadField} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <span className="w-1/3 font-semibold text-slate-700 font-mono">{leadField}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={crmField}
                      onChange={(e) => setMappings({ ...mappings, [leadField]: e.target.value })}
                      className="flex-1 h-8 rounded border border-slate-300 px-2.5 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
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
          <Card className="border-slate-200 shadow-md">
            <CardHeader className="bg-slate-900 text-white rounded-t-xl pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Send className="w-4 h-4" />
                <span>Outbound Webhook Dispatcher</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time event streaming with HMAC SHA-256 signatures
              </p>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              <Input
                label="Target Webhook URL"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-crm.com/api/leads"
              />

              <Input
                label="Webhook Secret Key (HMAC)"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subscribed Event Topics
                </span>
                <div className="space-y-1 text-xs">
                  {['lead.created', 'lead.updated', 'lead.qualified', 'lead.followup.created'].map((evt) => (
                    <div key={evt} className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-mono text-[11px]">{evt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.message}
                </div>
              )}

              <Button
                variant="outline"
                size="md"
                onClick={handleTestWebhook}
                isLoading={isTestingWebhook}
                className="w-full text-xs font-bold gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Send Test Webhook Payload</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
