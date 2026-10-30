'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
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
      className="card-base rounded-2xl border border-[var(--border-default)] bg-[var(--bg-glass)] overflow-hidden shadow-sm"
    >
      {/* Status Bar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--emerald-50)]">
        <div className="size-2.5 rounded-full bg-[var(--emerald-400)]" />
        <span className="text-xs font-bold text-[var(--emerald-600)]">
          Portal active
        </span>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left side: Info & Actions */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-[var(--border-subtle)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
            <QrCode className="size-5 text-[var(--saffron-600)]" />
            Library Portal QR Code
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Visitors scan this QR code to access your library app. They can view available seats, request a booking, and notify you instantly in the Requests dashboard. Allotments and tracking are handled entirely in the system.
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Open Portal */}
              <a
                href={url || '/'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] min-h-[44px] flex items-center justify-center gap-2 whitespace-nowrap px-4 rounded-[var(--radius-sm)] border border-[var(--ink)] bg-[var(--ink)] text-sm font-semibold text-[var(--text-inverse)] hover:bg-[var(--ink-hover)] transition-ui"
              >
                <ExternalLink className="size-4" />
                Open Portal
              </a>
              
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl font-bold text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer shadow-[var(--shadow-xs)]"
              >
                {copied ? <Check className="size-4 text-[var(--emerald-600)]" /> : <Copy className="size-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
               
              {/* WhatsApp Share */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] min-h-[44px] flex items-center justify-center gap-2 whitespace-nowrap px-4 rounded-[var(--radius-sm)] border border-[var(--emerald-500)] bg-[var(--bg-surface)] text-sm font-medium text-[var(--emerald-700)] hover:bg-[var(--emerald-50)] transition-ui"
              >
                <Share2 className="size-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Right side: QR Display */}
        <div className="p-8 flex flex-col items-center justify-center bg-[var(--bg-base)]/30">
          <div 
            ref={qrRef}
            className="p-4 bg-[var(--bg-elevated)] rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--border-subtle)] relative jaali-pattern"
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
              <div className="size-[200px] bg-[var(--bg-overlay)] animate-pulse flex items-center justify-center text-xs text-[var(--text-tertiary)]">Loading...</div>
            )}
          </div>
          <button
            onClick={handleDownload}
            disabled={!url}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--saffron-50)] text-[var(--saffron-700)] hover:bg-[var(--saffron-600)] hover:text-[var(--text-inverse)] rounded-[var(--radius-full)] font-bold text-sm transition-ui active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="size-4" />
            Download PNG
          </button>
          <p className="text-xs text-[var(--text-tertiary)] mt-3 text-center max-w-[200px]">
            Print and place at the front desk. Users scan to request a seat.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

