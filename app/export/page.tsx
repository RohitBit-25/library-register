'use client';

import { useState, useMemo } from 'react';
import { useMembers } from '@/hooks/useMembers';
import { useAttendance } from '@/hooks/useAttendance';
import { useSeatRequests } from '@/hooks/useSeatRequests';
import { useToast } from '@/hooks/useToast';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toCsv } from '@/lib/csv';
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
import PageHeader from '@/components/layout/PageHeader';
import { springUI } from '@/lib/motion';

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
    transition: springUI,
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
      const csv = toCsv(
        ['Seat', 'Name', 'Phone', 'Shift', 'Join Date', 'Duration', 'Expiry', 'Fee Status', 'Payment Mode'],
        occupiedMembers.map(m => [
          m.seat, m.name, m.phone, m.shift, m.joinDate,
          m.duration, m.expiry, m.fee, m.paymentMode || 'N/A',
        ])
      );
      downloadFile(csv, `gangaur-members-${dateStamp}.csv`, 'text/csv;charset=utf-8');
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
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const csv = toCsv(
        ['Date', 'Day', 'Present Count', 'Attendance Rate %'],
        thirtyDayData.map(d => [d.date, dayNames[d.dayOfWeek], d.count, d.rate])
      );
      downloadFile(csv, `gangaur-attendance-${dateStamp}.csv`, 'text/csv;charset=utf-8');
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
      const csv = toCsv(
        ['ID', 'Seat', 'Name', 'Phone', 'Status', 'Join Date', 'Duration', 'Shift', 'Payment Mode', 'Transaction ID', 'Date', 'Message'],
        requests.map(r => [
          r.id, r.seat, r.userName, r.userPhone, r.status,
          r.joinDate || '', r.duration || '', r.shift || '', r.paymentMode,
          r.transactionId || '', r.createdAt, r.message || '',
        ])
      );
      downloadFile(csv, `gangaur-requests-${dateStamp}.csv`, 'text/csv;charset=utf-8');
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
      iconBg: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
      accentBorder: 'border-l-[var(--border-default)]',
      onExport: exportMembers,
    },
    {
      title: 'Attendance',
      description: `${stats.attendanceDays} days of records • Last 30 days`,
      icon: <CalendarCheck className="w-5 h-5" />,
      iconBg: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
      accentBorder: 'border-l-[var(--border-default)]',
      onExport: exportAttendance,
    },
    {
      title: 'Seat Requests',
      description: `${requests.length} total • ${stats.pendingRequests} pending`,
      icon: <Inbox className="w-5 h-5" />,
      iconBg: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]',
      accentBorder: 'border-l-[var(--border-default)]',
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
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Data Export"
          icon={<HardDrive className="h-5 w-5" />}
          subtitle="Download members, attendance, and request data."
          actions={lastExport ? (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-muted)] px-3 py-1.5 text-xs font-semibold tabular text-[var(--text-secondary)]">
              <CheckCircle className="h-3.5 w-3.5 text-[var(--emerald-600)]" aria-hidden="true" />
              Last export: {lastExport}
            </div>
          ) : undefined}
        />
      </motion.div>

      {/* Full Backup Card */}
      <motion.div variants={itemVariants} className="mb-[var(--space-6)]">
        <Card variant="base" className="overflow-hidden border-l-2 border-l-[var(--saffron-500)]">
          <div className="p-[var(--space-5)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-4)]">
              <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--saffron-50)] flex items-center justify-center shrink-0">
                <Database className="w-6 h-6 text-[var(--ruby-600)]" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-[var(--text-primary)] flex items-center gap-[var(--space-2)]">
                  <Shield className="w-4 h-4 text-[var(--ruby-600)]" />
                  Full Database Backup
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-[var(--space-1)]">
                  All members, attendance records, and requests in a single JSON file.
                </p>
                <div className="flex items-center gap-[var(--space-3)] mt-[var(--space-2)] flex-wrap">
                  <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-muted)] px-2 py-0.5 rounded-md">
                    {stats.total} seats
                  </span>
                  <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-muted)] px-2 py-0.5 rounded-md">
                    {stats.attendanceDays} attendance days
                  </span>
                  <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-muted)] px-2 py-0.5 rounded-md">
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
            className={`overflow-hidden border-l ${card.accentBorder}`}
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
              { label: 'Active members', value: stats.occupied },
              { label: 'Vacant seats', value: stats.vacant },
              { label: 'Pending requests', value: stats.pendingRequests },
              { label: 'Attendance days', value: stats.attendanceDays },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="tabular font-display text-2xl font-semibold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">
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
