'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { INITIAL_AUDIT_LOGS } from '@/lib/data/mock-store';
import { AuditLog } from '@/lib/types';
import { Shield, Clock, Search, Terminal, Globe, Filter } from 'lucide-react';

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
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Compliance & Security</span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident trail of lead exports, authentication attempts, permissions changes, and sync triggers.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs font-semibold text-slate-600 max-w-lg">
        {['all', 'lead_created', 'form_updated', 'export_generated'].map((act) => (
          <button
            key={act}
            onClick={() => setFilterAction(act)}
            className={`flex-1 py-1.5 rounded-lg transition font-mono uppercase text-[11px] ${
              filterAction === act ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            {act.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Timestamp (UTC)</th>
              <th className="p-3">User & IP</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity Details</th>
              <th className="p-3">Payload Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3 text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  <div className="font-bold text-slate-800 font-sans">{log.user_email}</div>
                  <div className="text-[10px] text-slate-400">{log.ip_address}</div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 font-sans font-medium text-slate-700">
                  {log.entity_type} #{log.entity_id}
                </td>
                <td className="p-3 text-slate-500 max-w-xs truncate">
                  {JSON.stringify(log.new_data)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
