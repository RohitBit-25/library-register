'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, Clock, Activity, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuditLogEntry {
  _id: string;
  action: string;
  details: string;
  seat?: number;
  user: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLogs(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-[var(--space-6)] max-w-5xl mx-auto py-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <Shield className="w-7 h-7 text-[var(--sapphire-500)]" />
          Audit Logs
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Activity history and system logs for complete accountability.
        </p>
      </div>

      <Card variant="base" className="overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 backdrop-blur-xl bg-[var(--bg-surface)]/90 border-b border-[var(--border-default)]">
              <tr>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Action</th>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Details</th>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Seat</th>
                <th className="text-left p-4 font-bold text-[var(--text-secondary)]">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--text-tertiary)]">Loading logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[var(--text-tertiary)] flex flex-col items-center">
                    <Activity className="w-8 h-8 opacity-20 mb-2" />
                    No activity recorded yet
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <motion.tr 
                    key={log._id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-[var(--bg-muted)] transition-colors"
                  >
                    <td className="p-4 font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)]">
                      {log.details}
                    </td>
                    <td className="p-4 font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                      {log.seat ? `#${log.seat.toString().padStart(2, '0')}` : '-'}
                    </td>
                    <td className="p-4 text-[var(--text-tertiary)] whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
