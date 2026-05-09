'use client';

import { useState, useMemo } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';
import { fmtDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, Variants } from 'framer-motion';
import {
  Download,
  FileSpreadsheet,
  CalendarCheck,
  Inbox,
  Database,
  FileJson,
  CheckCircle,
  Shield,
  HardDrive,
  Clock,
} from 'lucide-react';

const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

type ExportFormat = 'csv' | 'json';

export default function ExportPage() {
  const { members } = useMembers();
  const { history, getLast30DaysData } = useAttendance();
  const { requests } = useSeatRequests();
  const { addToast } = useToast();
  const [lastExport, setLastExport] = useState<string | null>(null);

  const stats = useMemo(() => {
    const occupied = members.filter(m => !m.vacant).length;
    const vacant = members.filter(m => m.vacant).length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    const attendanceDays = history.length;
    return { occupied, vacant, total: members.length, pendingRequests, attendanceDays };
  }, [members, requests, history]);

  // ─── Download helper ──────────────────────────────────────────
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setLastExport(new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }));
  };

  // ─── Members Export ───────────────────────────────────────────
  const exportMembers = (format: ExportFormat) => {
    const occupiedMembers = members.filter(m => !m.vacant);

    if (occupiedMembers.length === 0) {
      addToast('warning', 'No members to export');
      return;
    }

    const dateStamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const headers = 'Seat,Name,Phone,Shift,Join Date,Duration,Expiry,Fee Status,Payment Mode\n';
      const rows = occupiedMembers.map(m =>
        `${m.seat},"${m.name}","${m.phone}",${m.shift},${m.joinDate},${m.duration},${m.expiry},${m.fee},${m.paymentMode || 'N/A'}`
      ).join('\n');
      downloadFile(headers + rows, `gangaur-members-${dateStamp}.csv`, 'text/csv;charset=utf-8');
    } else {
      const data = occupiedMembers.map(m => ({
        seat: m.seat,
        name: m.name,
        phone: m.phone,
        shift: m.shift,
        joinDate: m.joinDate,
        duration: m.duration,
        expiry: m.expiry,
        fee: m.fee,
        paymentMode: m.paymentMode || null,
      }));
      downloadFile(JSON.stringify(data, null, 2), `gangaur-members-${dateStamp}.json`, 'application/json');
    }

    addToast('success', `Members exported as ${format.toUpperCase()}`);
  };

  // ─── Attendance Export ────────────────────────────────────────
  const exportAttendance = (format: ExportFormat) => {
    const thirtyDayData = getLast30DaysData();
    const dateStamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const headers = 'Date,Day,Present Count,Attendance Rate %\n';
      const rows = thirtyDayData.map(d => {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.dayOfWeek];
        return `${d.date},${dayName},${d.count},${d.rate}`;
      }).join('\n');
      downloadFile(headers + rows, `gangaur-attendance-${dateStamp}.csv`, 'text/csv;charset=utf-8');
    } else {
      downloadFile(JSON.stringify(thirtyDayData, null, 2), `gangaur-attendance-${dateStamp}.json`, 'application/json');
    }

    addToast('success', `Attendance data exported as ${format.toUpperCase()}`);
  };

  // ─── Requests Export ──────────────────────────────────────────
  const exportRequests = (format: ExportFormat) => {
    if (requests.length === 0) {
      addToast('warning', 'No requests to export');
      return;
    }

    const dateStamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const headers = 'ID,Seat,Name,Phone,Status,Payment Mode,Transaction ID,Date,Message\n';
      const rows = requests.map(r =>
        `${r.id},${r.seat},"${r.userName}","${r.userPhone}",${r.status},${r.paymentMode},"${r.transactionId || ''}","${r.createdAt}","${(r.message || '').replace(/"/g, '""')}"`
      ).join('\n');
      downloadFile(headers + rows, `gangaur-requests-${dateStamp}.csv`, 'text/csv;charset=utf-8');
    } else {
      downloadFile(JSON.stringify(requests, null, 2), `gangaur-requests-${dateStamp}.json`, 'application/json');
    }

    addToast('success', `Requests exported as ${format.toUpperCase()}`);
  };

  // ─── Full Backup ──────────────────────────────────────────────
  const exportFullBackup = () => {
    const dateStamp = new Date().toISOString().split('T')[0];
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      members: members,
      attendance: history,
      requests: requests,
      stats: {
        totalMembers: stats.occupied,
        totalVacant: stats.vacant,
        totalRequests: requests.length,
        attendanceRecords: history.length,
      },
    };

    downloadFile(
      JSON.stringify(backup, null, 2),
      `gangaur-full-backup-${dateStamp}.json`,
      'application/json'
    );
    addToast('success', 'Full backup downloaded successfully');
  };

  // ─── Export cards config ──────────────────────────────────────
  const exportCards = [
    {
      title: 'Members',
      description: `${stats.occupied} active members • ${stats.vacant} vacant seats`,
      icon: <FileSpreadsheet className="w-5 h-5" />,
      iconBg: 'bg-[var(--sapphire-500)]/10 text-[var(--sapphire-500)]',
      accentBorder: 'border-l-[var(--sapphire-500)]',
      onExport: exportMembers,
    },
    {
      title: 'Attendance',
      description: `${stats.attendanceDays} days of records • Last 30 days`,
      icon: <CalendarCheck className="w-5 h-5" />,
      iconBg: 'bg-[var(--emerald-500)]/10 text-[var(--emerald-500)]',
      accentBorder: 'border-l-[var(--emerald-500)]',
      onExport: exportAttendance,
    },
    {
      title: 'Seat Requests',
      description: `${requests.length} total • ${stats.pendingRequests} pending`,
      icon: <Inbox className="w-5 h-5" />,
      iconBg: 'bg-[var(--saffron-500)]/10 text-[var(--saffron-500)]',
      accentBorder: 'border-l-[var(--saffron-500)]',
      onExport: exportRequests,
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-4xl pb-24"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-[var(--space-6)] flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[var(--tracking-tight)] text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
            <HardDrive className="w-6 h-6 text-[var(--sapphire-500)]" />
            Data Export
          </h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-[var(--space-1)]">
            Download members, attendance, and request data.
          </p>
        </div>
        {lastExport && (
          <div className="flex items-center gap-[var(--space-2)] text-xs font-mono text-[var(--text-tertiary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] shadow-[var(--shadow-sm)]">
            <CheckCircle className="w-3.5 h-3.5 text-[var(--emerald-500)]" />
            Last export: {lastExport}
          </div>
        )}
      </motion.div>

      {/* Full Backup Card */}
      <motion.div variants={itemVariants} className="mb-[var(--space-6)]">
        <Card variant="base" className="overflow-hidden border-l-4 border-l-[var(--ruby-500)]">
          <div className="p-[var(--space-5)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-4)]">
              <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--ruby-500)]/10 flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-[var(--ruby-500)]" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
                  <Shield className="w-4 h-4 text-[var(--ruby-500)]" />
                  Full Database Backup
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-[var(--space-1)]">
                  All members, attendance records, and requests in a single JSON file.
                </p>
                <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-2)] flex-wrap">
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-muted)] px-2 py-0.5 rounded-md">
                    {stats.total} seats
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-muted)] px-2 py-0.5 rounded-md">
                    {stats.attendanceDays} attendance days
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-muted)] px-2 py-0.5 rounded-md">
                    {requests.length} requests
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={exportFullBackup}
              className="bg-[var(--ruby-500)] hover:bg-[var(--ruby-600)] text-[var(--saffron-50)] border-transparent shrink-0"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Full Backup
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Individual Export Cards */}
      <motion.div variants={itemVariants} className="space-y-[var(--space-4)]">
        <h3 className="font-display text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-[var(--space-2)]">
          <Clock className="w-4 h-4" />
          Export by Category
        </h3>

        {exportCards.map((card) => (
          <Card
            key={card.title}
            variant="base"
            className={`overflow-hidden border-l-4 ${card.accentBorder}`}
          >
            <div className="p-[var(--space-5)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[var(--space-4)]">
              {/* Info */}
              <div className="flex items-center gap-[var(--space-4)]">
                <div className={`w-10 h-10 rounded-[var(--radius-xl)] flex items-center justify-center shrink-0 ${card.iconBg}`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-[var(--text-primary)]">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-[var(--space-1)]">
                    {card.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-[var(--space-2)] shrink-0 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => card.onExport('csv')}
                  className="flex-1 sm:flex-initial"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => card.onExport('json')}
                  className="flex-1 sm:flex-initial"
                >
                  <FileJson className="w-3.5 h-3.5 mr-1.5" />
                  JSON
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Data Summary Footer */}
      <motion.div variants={itemVariants} className="mt-[var(--space-8)]">
        <Card variant="base" className="p-[var(--space-5)]">
          <h3 className="font-display text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-[var(--space-4)]">
            Quick Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[var(--space-4)]">
            {[
              { label: 'Active Members', value: stats.occupied, color: 'text-[var(--sapphire-500)]' },
              { label: 'Vacant Seats', value: stats.vacant, color: 'text-[var(--text-tertiary)]' },
              { label: 'Pending Requests', value: stats.pendingRequests, color: 'text-[var(--saffron-500)]' },
              { label: 'Attendance Days', value: stats.attendanceDays, color: 'text-[var(--emerald-500)]' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`font-display text-2xl font-semibold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
