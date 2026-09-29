'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_AUDIT_LOGS } from '@/lib/data/mock-store';
import { AuditLog } from '@/lib/types';
import { Shield, Clock, Search, Terminal, Globe, Filter, Sparkles, ShieldCheck } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = logs.filter((l) => {
    if (filterAction === 'all') return true;
    return l.action === filterAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <span className="text-[11px] font-black uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1">
          <ShieldCheck className="w-3 h-3 text-brand-600" />
          Enterprise Compliance & Immutable Auditing
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">System Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident trail of lead exports, authentication attempts, permissions changes, and sync triggers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-slate-200/80 p-1 text-xs font-bold text-slate-600 max-w-lg">
        {['all', 'lead_created', 'form_updated', 'export_generated'].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`flex-1 py-1.5 rounded-lg transition font-mono uppercase text-[10px] ${
              filterAction === act ? 'bg-white text-slate-900 shadow-xs font-black' : 'hover:text-slate-900'
            }`}
          >
            {act.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <Card className="p-0 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Timestamp (UTC)</th>
                <th className="p-3.5">User & IP Address</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Audit Payload Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 font-sans">{log.user_email}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{log.ip_address}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-md font-bold uppercase text-[10px] bg-brand-50 text-brand-800 border border-brand-200/60">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-sans font-semibold text-slate-700">
                    {log.entity_type} #{log.entity_id}
                  </td>
                  <td className="p-3.5 text-slate-600 max-w-xs truncate font-mono text-[10px]">
                    {JSON.stringify(log.new_data)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
