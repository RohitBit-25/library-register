'use client';

import { todayISO } from '@/lib/utils';

import { useMembers } from '@/hooks/useMembers';
import { useUndoable } from '@/hooks/useUndoable';
import { useToast } from '@/hooks/useToast';
import MemberTable from '@/components/member/MemberTable';
import Modal from '@/components/ui/Modal';
import { toCsv } from '@/lib/csv';
import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Users } from 'lucide-react';
import MembersLoadError from '@/components/seat/MembersLoadError';

export default function MembersPage() {
  const { members, update, vacate, bulkMarkPaid, bulkRemove, preview, retry } = useMembers();
  const hold = useUndoable();
  const { addToast } = useToast();
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [confirmBulkRemove, setConfirmBulkRemove] = useState<number[] | null>(null);

  const handleMarkPaid = (seat: number) => {
    preview(seat, { fee: 'paid' });
    hold(`paid-${seat}`, `Seat ${seat} — fee marked as paid`,
      () => update(seat, { fee: 'paid' }, (msg) => addToast('error', msg)), retry);
  };

  const handleMarkDue = (seat: number) => {
    update(seat, { fee: 'due' }, (msg) => addToast('error', msg));
    addToast('warning', `Seat ${seat} — fee marked as due`);
  };

  const handleRenew = (seat: number) => {
    window.location.href = `/?seat=${seat}`;
  };

  const handleRemove = (seat: number) => {
    setConfirmRemove(seat);
  };

  const handleBulkMarkPaid = (seats: number[]) => {
    bulkMarkPaid(seats, (msg) => addToast('error', msg));
    addToast('success', `${seats.length} members marked as paid`);
  };

  const handleBulkRemove = (seats: number[]) => {
    setConfirmBulkRemove(seats);
  };

  const handleBulkExport = (seats: number[]) => {
    const selectedMembers = members.filter(m => seats.includes(m.seat) && !m.vacant);
    if (selectedMembers.length === 0) return;
    
    // Same shared helper as the Export page. This used to build rows by hand
    // with bare quotes and no escaping, so a name containing `"` split the row
    // and a name starting with `=`/`+`/`-`/`@` executed as a formula in Excel —
    // and names come from the public seat-request form.
    const csv = toCsv(
      ['Seat', 'Name', 'Phone', 'Shift', 'JoinDate', 'Duration', 'Expiry', 'FeeStatus'],
      selectedMembers.map(m => [
        m.seat, m.name, m.phone, m.shift, m.joinDate, m.duration, m.expiry, m.fee,
      ])
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-members-export-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', `Exported ${selectedMembers.length} members to CSV`);
  };

  const handleBulkWhatsApp = (seats: number[]) => {
    const selectedMembers = members.filter(m => seats.includes(m.seat) && !m.vacant && m.phone);
    if (selectedMembers.length === 0) {
      addToast('error', 'No phone numbers found for selected members');
      return;
    }
    
    const phones = selectedMembers.map(m => m.phone).join(', ');
    navigator.clipboard.writeText(phones).then(() => {
      addToast('success', `Copied ${selectedMembers.length} phone numbers to clipboard!`);
    }).catch(() => {
      addToast('error', 'Failed to copy to clipboard');
    });
  };

  const handleEdit = (seat: number) => {
    window.location.href = `/?seat=${seat}`;
  };

  return (
    <div>
      <PageHeader
        title="Members"
        icon={<Users className="size-5" />}
        subtitle={`${members.filter(m => !m.vacant).length} members · ${members.filter(m => m.vacant).length} vacant`}
      />
      <MembersLoadError />

      <MemberTable
        members={members}
        onMarkPaid={handleMarkPaid}
        onMarkDue={handleMarkDue}
        onRenew={handleRenew}
        onRemove={handleRemove}
        onEdit={handleEdit}
        onBulkMarkPaid={handleBulkMarkPaid}
        onBulkRemove={handleBulkRemove}
        onBulkExport={handleBulkExport}
        onBulkWhatsApp={handleBulkWhatsApp}
      />

      {/* Single remove confirm */}
      <Modal
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        title={`Remove member from Seat ${confirmRemove}?`}
        description="This will free the seat for a new member. This action cannot be undone."
        confirmLabel="Remove"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmRemove !== null) {
            vacate(confirmRemove);
            addToast('warning', `Seat ${confirmRemove} vacated`);
            setConfirmRemove(null);
          }
        }}
      />

      {/* Bulk remove confirm */}
      <Modal
        open={confirmBulkRemove !== null}
        onClose={() => setConfirmBulkRemove(null)}
        title={`Remove ${confirmBulkRemove?.length} members?`}
        description="This will free all selected seats. This action cannot be undone."
        confirmLabel="Remove All"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmBulkRemove) {
            bulkRemove(confirmBulkRemove);
            addToast('warning', `${confirmBulkRemove.length} members removed`);
            setConfirmBulkRemove(null);
          }
        }}
      />
    </div>
  );
}
