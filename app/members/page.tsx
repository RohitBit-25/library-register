'use client';

import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import MemberTable from '@/components/member/MemberTable';
import Modal from '@/components/ui/Modal';
import { useState } from 'react';

export default function MembersPage() {
  const { members, update, vacate, bulkMarkPaid, bulkRemove } = useMembers();
  const { addToast } = useToast();
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);
  const [confirmBulkRemove, setConfirmBulkRemove] = useState<number[] | null>(null);

  const handleMarkPaid = (seat: number) => {
    update(seat, { fee: 'paid' }, (msg) => addToast('error', msg));
    addToast('success', `Seat ${seat} — fee marked as paid`);
  };

  const handleMarkDue = (seat: number) => {
    update(seat, { fee: 'due' }, (msg) => addToast('error', msg));
    addToast('warning', `Seat ${seat} — fee marked as due`);
  };

  const handleRenew = (seat: number) => {
    // Navigate to seat grid with the seat selected for renewal
    window.location.href = `/seat-grid?seat=${seat}`;
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
    
    const headers = 'Seat,Name,Phone,Shift,JoinDate,Duration,Expiry,FeeStatus\n';
    const rows = selectedMembers.map(m => 
      `${m.seat},"${m.name}","${m.phone}",${m.shift},${m.joinDate},${m.duration},${m.expiry},${m.fee}`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-members-export-${new Date().toISOString().split('T')[0]}.csv`;
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
    // Navigate to seat grid with the seat selected for inline editing
    window.location.href = `/?seat=${seat}`;
  };

  return (
    <div>
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-[var(--text-xl)] sm:text-[var(--text-2xl)] font-[var(--weight-extrabold)] text-[var(--text-primary)] tracking-tight">
            All Members
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mt-0.5">
            {members.filter(m => !m.vacant).length} members · {members.filter(m => m.vacant).length} vacant
          </p>
        </div>
      </div>

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
