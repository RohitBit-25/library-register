'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, QrCode, Armchair, Send, Inbox } from 'lucide-react';
import QRCodePanel from '@/components/setup/QRCodePanel';
import PageHeader from '@/components/layout/PageHeader';
import { springUI } from '@/lib/motion';

const containerVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: springUI }
};

/**
 * The request link and its QR code.
 *
 * This page used to walk the owner through a Google Forms + Sheets + Apps
 * Script setup that emailed submissions. The app's own request form replaced
 * all of that — students request a desk on the live plan and it lands in
 * Requests — so the guide described a flow nobody should build any more.
 */
export default function SetupPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="max-w-[1000px] pb-12"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Request link"
          icon={<QrCode className="size-5" />}
          subtitle="Print the QR for the front desk, or share the link — students request a desk from their phone."
        />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8">
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-5 text-xs font-bold text-[var(--text-tertiary)]">How a request reaches you</h2>
          <ol className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {[
              { icon: <QrCode className="size-5" />, label: 'Student scans the QR' },
              { icon: <Armchair className="size-5" />, label: 'Picks a free desk' },
              { icon: <Send className="size-5" />, label: 'Sends name, phone, payment' },
              { icon: <Inbox className="size-5" />, label: 'You approve in Requests', accent: true },
            ].map((step, i) => (
              <li key={step.label} className="flex items-center gap-3 sm:gap-4">
                <div className={`flex flex-col items-center gap-2 rounded-xl border border-current/10 px-4 py-3 ${step.accent ? 'bg-[var(--saffron-50)] text-[var(--saffron-700)]' : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'}`}>
                  {step.icon}
                  <span className="whitespace-nowrap text-xs font-bold">{step.label}</span>
                </div>
                {i < 3 && <ArrowRight className="hidden size-4 shrink-0 text-[var(--text-tertiary)] sm:block" aria-hidden="true" />}
              </li>
            ))}
          </ol>
          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            New requests ping you while the app is open and show on{' '}
            <Link href="/requests" className="font-semibold text-[var(--text-primary)] underline underline-offset-4">Requests</Link>.
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <QRCodePanel />
      </motion.div>
    </motion.div>
  );
}
