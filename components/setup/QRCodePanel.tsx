'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Copy, Check, ExternalLink, QrCode, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { motion } from 'framer-motion';

export default function QRCodePanel() {
  const [url, setUrl] = useState('');
  const { addToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Use the origin URL so users land on the app's entry (landing page)
  useEffect(() => {
    const timer = setTimeout(() => {
      setUrl(window.location.origin);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'library-registration-qr.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    addToast('success', 'QR Code downloaded successfully');
  };

  const handleCopyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast('success', 'Portal link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Failed to copy link');
    }
  };

  const encodedMessage = encodeURIComponent(`Join our library! Scan our QR or click here to request a seat: ${url}`);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-premium accent-blue rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark overflow-hidden shadow-sm"
    >
      {/* Status Bar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--border-subtle)] bg-[rgba(34,195,106,0.15)]">
        <div className="w-2.5 h-2.5 rounded-full bg-[var(--emerald-400)] animate-pulse-subtle" />
        <span className="text-xs font-bold text-[var(--emerald-400)]">
          ✓ App Portal Active
        </span>
        <Sparkles className="w-3.5 h-3.5 text-[var(--emerald-400)] ml-auto" />
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left side: Info & Actions */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-card-border dark:border-card-border-dark">
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[var(--saffron-500)]" />
            Library Portal QR Code
          </h2>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
            Visitors scan this QR code to access your library app. They can view available seats, request a booking, and notify you instantly in the Requests dashboard. Allotments and tracking are handled entirely in the system.
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Open Portal */}
              <a
                href={url || '/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--saffron-500)] text-[#1a1a16] rounded-[var(--radius-md)] font-[var(--weight-bold)] text-sm hover:opacity-90 transition-all shadow-[var(--shadow-glow-saffron)]"
              >
                <ExternalLink className="w-4 h-4" />
                Open Portal
              </a>
              
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-xl font-bold text-sm text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-active-border" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
               
              {/* WhatsApp Share */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Right side: QR Display */}
        <div className="p-8 flex flex-col items-center justify-center bg-bg/30 dark:bg-bg-dark/30">
          <div 
            ref={qrRef}
            className="p-4 bg-[var(--bg-elevated)] rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border-subtle)] relative qr-container"
          >
            {url ? (
              <QRCodeCanvas 
                value={url} 
                size={200}
                level="H"
                includeMargin={true}
                bgColor="#1a1a16"
                fgColor="#E8853A"
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-[var(--bg-overlay)] animate-pulse flex items-center justify-center text-xs text-[var(--text-tertiary)]">Loading...</div>
            )}
          </div>
          <button
            onClick={handleDownload}
            disabled={!url}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--saffron-500)]/15 text-[var(--saffron-400)] hover:bg-[var(--saffron-500)] hover:text-white rounded-[var(--radius-full)] font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
          <p className="text-[10px] text-text-tertiary dark:text-text-tertiary-dark mt-3 text-center max-w-[200px]">
            Print and place at the front desk. Users scan to request a seat.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

