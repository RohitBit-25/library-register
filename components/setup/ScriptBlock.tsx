'use client';

import { useState } from 'react';
import { Copy, Check, Info, Shield } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { motion } from 'framer-motion';
import { springUI } from '@/lib/motion';

const APPS_SCRIPT_TEMPLATE = `// -----------------------------------------------------
// Gangaur Library Seat Management - v2.0
// Next.js Web App Integration Script
// -----------------------------------------------------

const ADMIN_EMAIL = "admin@gangaurlibrary.com"; // <-- CHANGE THIS
const TOTAL_SEATS = 95;

function onFormSubmit(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();
    
    // Read the newly submitted row
    var rowValues = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Assumes columns based on standard setup:
    // A: Timestamp
    // B: Full Name
    // C: Phone Number
    // D: Join Date
    // E: Duration (1M / 3M / 6M / 1Y)
    // F: Preferred Shift
    // G: Status (Paid/Due)
    
    var timestamp = rowValues[0];
    var name = rowValues[1];
    var phone = String(rowValues[2]);
    var joinDate = new Date(rowValues[3] || timestamp);
    var duration = rowValues[4] || '1M';
    var shift = rowValues[5] || 'Full Day';
    var feeStatus = rowValues[6] || 'Due';
    
    // 1. Duplicate Check
    if (isDuplicatePhone(sheet, phone, lastRow)) {
      sendAlertEmail("Duplicate Registration Attempt", "Someone tried to register with an existing phone: " + phone);
      // Optional: Delete the duplicate row
      return;
    }
    
    // 2. Format Expiry Date
    var expiryDate = calculateExpiry(joinDate, duration);
    var formattedExpiry = Utilities.formatDate(expiryDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
    
    // Write Expiry back to column H
    sheet.getRange(lastRow, 8).setValue(formattedExpiry);
    
    // 3. Email Admin
    sendAdminNotification(name, phone, duration, shift, feeStatus, formattedExpiry);
    
  } catch (error) {
    sendAlertEmail("Library Form Script Error", error.toString());
  }
}

function calculateExpiry(joinDate, durationStr) {
  var ext = new Date(joinDate);
  if (durationStr === '1M') ext.setMonth(ext.getMonth() + 1);
  if (durationStr === '3M') ext.setMonth(ext.getMonth() + 3);
  if (durationStr === '6M') ext.setMonth(ext.getMonth() + 6);
  if (durationStr === '1Y') ext.setFullYear(ext.getFullYear() + 1);
  return ext;
}

function isDuplicatePhone(sheet, newPhone, lastRow) {
  if (lastRow <= 2) return false;
  var phoneColumn = sheet.getRange(2, 3, lastRow - 2, 1).getValues();
  for (var i = 0; i < phoneColumn.length; i++) {
    if (String(phoneColumn[i][0]).replace(/\\D/g, '') === newPhone.replace(/\\D/g, '')) {
      return true;
    }
  }
  return false;
}

function sendAdminNotification(name, phone, duration, shift, fee, expiry) {
  var subject = "New Library Member: " + name;
  var body = "<h3>New Member Registration</h3>" +
             "<table border='1' cellpadding='5' style='border-collapse: collapse;'>" +
             "<tr><td><b>Name</b></td><td>" + name + "</td></tr>" +
             "<tr><td><b>Phone</b></td><td>" + phone + "</td></tr>" +
             "<tr><td><b>Shift</b></td><td>" + shift + "</td></tr>" +
             "<tr><td><b>Duration</b></td><td>" + duration + "</td></tr>" +
             "<tr><td><b>Fee Status</b></td><td>" + fee + "</td></tr>" +
             "<tr><td><b>Expiry</b></td><td>" + expiry + "</td></tr>" +
             "</table>" +
             "<br><p>Please open your Library App and tap <b>Allot New Seat</b> to assign them to the register.</p>";
             
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: subject,
    htmlBody: body
  });
}

function sendAlertEmail(subject, msg) {
  MailApp.sendEmail(ADMIN_EMAIL, "[ALERT] " + subject, msg);
}`;

export default function ScriptBlock() {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
      setCopied(true);
      addToast('success', 'Script copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Failed to copy script to clipboard');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springUI, delay: 0.1 }}
      className="mt-8 bg-[#1a1b26] border border-[#2a2b3d] rounded-2xl overflow-hidden shadow-lg"
    >
      {/* Code editor header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2b3d] bg-[#13141f]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[var(--ruby-500)]" />
            <div className="h-3 w-3 rounded-full bg-[var(--marigold-500)]" />
            <div className="h-3 w-3 rounded-full bg-[var(--emerald-500)]" />
          </div>
          <span className="ml-3 text-xs font-mono text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Code.gs
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3.5 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-ui hover:border-[var(--border-default)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-[var(--emerald-600)]" aria-hidden="true" />
            : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      
      {/* Code content */}
      <div className="p-5 overflow-x-auto max-h-[400px] overflow-y-auto">
        <pre className="text-[13px] font-mono leading-relaxed text-[#d4d4d4]">
          <code>{APPS_SCRIPT_TEMPLATE}</code>
        </pre>
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-3 border-t border-[var(--sapphire-200)] bg-[var(--sapphire-50)] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--sapphire-600)]" aria-hidden="true" />
        <p className="text-sm text-[var(--text-secondary)]">
          <strong className="text-[var(--sapphire-600)]">Important:</strong> Change the{' '}
          <code className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-xs text-[var(--text-primary)]">ADMIN_EMAIL</code>{' '}
          at the top of the script to your own email address.
        </p>
      </div>
    </motion.div>
  );
}
