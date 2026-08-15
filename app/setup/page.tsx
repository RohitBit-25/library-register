'use client';

import { motion, Variants } from 'framer-motion';
import { ExternalLink, ListChecks, Zap, ArrowRight, QrCode, Mail, FileText } from 'lucide-react';
import QRCodePanel from '@/components/setup/QRCodePanel';
import ScriptBlock from '@/components/setup/ScriptBlock';
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
          title="Automation Setup"
          icon={<Zap className="h-5 w-5" />}
          subtitle="Connect Google Forms for automated seat allotment and email notifications."
        />
      </motion.div>

      {/* Automation Flow Diagram */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="card-base rounded-2xl border border-[var(--border-default)] bg-[var(--bg-glass)] p-6 overflow-hidden">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-5">
            How It Works — Zero Manual Work
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {[
              { icon: <QrCode className="w-5 h-5" />, label: 'Member scans QR', color: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]' },
              { icon: <FileText className="w-5 h-5" />, label: 'Fills the form', color: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]' },
              { icon: <Zap className="w-5 h-5" />, label: 'Script runs', color: 'bg-[var(--bg-muted)] text-[var(--text-secondary)]' },
              { icon: <Mail className="w-5 h-5" />, label: 'You get an email', color: 'bg-[var(--saffron-50)] text-[var(--saffron-700)]' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <div className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl ${step.color} border border-current/10`}>
                  {step.icon}
                  <span className="text-xs font-bold whitespace-nowrap">{step.label}</span>
                </div>
                {i < 3 && (
                  <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* QR Code and Sharing Actions */}
      <motion.div variants={itemVariants}>
        <QRCodePanel />
      </motion.div>

      {/* Instruction Guide */}
      <motion.div variants={itemVariants} className="mt-8">
        <h2 className="text-lg font-extrabold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-[var(--sapphire-600)]" />
          Integration guide
        </h2>

        <div className="space-y-4">
          
          {/* Step 1 */}
          <div className="card-base p-5 rounded-xl shadow-sm" style={{ borderLeft: '3px solid var(--saffron-500)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--saffron-600)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-sm shadow-sm">
                1
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Create your Google Form</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Go to <a href="https://forms.google.com" target="_blank" rel="noreferrer" className="text-[var(--sapphire-600)] hover:underline inline-flex items-center gap-1">Google Forms <ExternalLink className="w-4 h-4" /></a> and create a new form with the following Short Answer/Dropdown questions EXACTLY in this order:
                </p>
                <ol className="list-decimal list-inside mt-2 text-xs font-mono bg-[var(--bg-base)] border border-[var(--border-default)] p-3 rounded-lg text-[var(--text-tertiary)]">
                  <li>Full Name</li>
                  <li>Phone Number (Short answer)</li>
                  <li>Join Date (Date)</li>
                  <li>Membership Duration (Dropdown: 1M, 3M, 6M, 1Y)</li>
                  <li>Preferred Shift (Dropdown: Morning, Evening, Full Day)</li>
                  <li>Fee Status (Dropdown: Paid, Due)</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card-base p-5 rounded-xl shadow-sm" style={{ borderLeft: '3px solid var(--saffron-500)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--saffron-600)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-sm shadow-sm">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Link to Google Sheets</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  In your Google Form, click on <strong>Responses</strong> &gt; <strong>Link to Sheets</strong> and create a new spreadsheet.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card-base p-5 rounded-xl shadow-sm" style={{ borderLeft: '3px solid var(--saffron-500)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--saffron-600)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-sm shadow-sm">
                3
              </div>
              <div className="w-full">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Paste the Automation Code</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Open your connected Google Sheet. Click on <strong>Extensions</strong> &gt; <strong>Apps Script</strong>. Delete all existing code and paste the following snippet:
                </p>
                
                <ScriptBlock />
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="card-base p-5 rounded-xl shadow-sm" style={{ borderLeft: '3px solid var(--saffron-500)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--saffron-600)] text-[var(--text-inverse)] flex items-center justify-center font-bold text-sm shadow-sm">
                4
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Create the Submit Trigger</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  In Apps Script, click the <strong>Clock icon (Triggers)</strong> on the left side. Add a new trigger:
                </p>
                <ul className="list-disc list-inside mt-2 text-xs font-mono bg-[var(--bg-base)] border border-[var(--border-default)] p-3 rounded-lg text-[var(--text-tertiary)] leading-loose">
                  <li>Function to run: <strong className="text-[var(--sapphire-600)]">onFormSubmit</strong></li>
                  <li>Event source: <strong className="text-[var(--sapphire-600)]">From spreadsheet</strong></li>
                  <li>Event type: <strong className="text-[var(--sapphire-600)]">On form submit</strong></li>
                </ul>
                <p className="text-xs text-[var(--text-secondary)] mt-3 italic">
                  Save the trigger and grant the required permissions when prompted by Google. You are all set!
                </p>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
