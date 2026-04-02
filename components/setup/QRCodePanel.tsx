'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Copy, Check, ExternalLink, LinkIcon, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { motion } from 'framer-motion';

const FORM_STORAGE_KEY = 'library-google-form-url';
const DEFAULT_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSckdwhQyUP4KK_dBaQOPcOYArIINsuQgjynSGo7-2RZiGvQdw/viewform?usp=header';

interface QRCodePanelProps {
  initialUrl?: string;
  defaultMessage?: string;
}

export default function QRCodePanel({ 
  initialUrl,
  defaultMessage = 'Join our library — fill this form to get a seat: '
}: QRCodePanelProps) {
  const [url, setUrl] = useState(DEFAULT_FORM_URL);
  const { addToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isLinked, setIsLinked] = useState(true);

  const isValidFormUrl = (u: string) => {
    return u.includes('docs.google.com/forms') || u.includes('forms.gle/');
  };

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(FORM_STORAGE_KEY);
    const timer = setTimeout(() => {
      if (stored) {
        setUrl(stored);
        setIsLinked(isValidFormUrl(stored));
      } else if (initialUrl) {
        setUrl(initialUrl);
        setIsLinked(isValidFormUrl(initialUrl));
      } else {
        setIsLinked(isValidFormUrl(DEFAULT_FORM_URL));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [initialUrl]);

  // Save to localStorage on URL change
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setIsLinked(isValidFormUrl(newUrl));
    localStorage.setItem(FORM_STORAGE_KEY, newUrl);
  };

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
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast('success', 'Form link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Failed to copy link');
    }
  };

  const encodedMessage = encodeURIComponent(`${defaultMessage}${url}`);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-premium accent-blue rounded-2xl border border-card-border dark:border-card-border-dark bg-surface dark:bg-surface-dark overflow-hidden shadow-sm"
    >
      {/* Status Bar */}
      <div className={`flex items-center gap-2 px-6 py-3 border-b border-card-border dark:border-card-border-dark ${isLinked ? 'bg-active-fill/50 dark:bg-active-fill-dark/30' : 'bg-due-fill/50 dark:bg-due-fill-dark/30'}`}>
        <div className={`w-2.5 h-2.5 rounded-full ${isLinked ? 'bg-active-border animate-pulse-subtle' : 'bg-due-border'}`} />
        <span className={`text-xs font-bold ${isLinked ? 'text-active-text dark:text-active-text-dark' : 'text-due-text dark:text-due-text-dark'}`}>
          {isLinked ? '✓ Google Form Connected' : '⚠ Paste your Google Form URL below'}
        </span>
        {isLinked && (
          <Sparkles className="w-3.5 h-3.5 text-active-border ml-auto" />
        )}
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Left side: Input & Actions */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-card-border dark:border-card-border-dark">
          <h2 className="text-xl font-extrabold text-text-primary dark:text-text-primary-dark mb-2 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-accent" />
            Registration QR Code
          </h2>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
            Members scan this QR at the front desk → fills the Google Form → you get an email notification automatically.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary dark:text-text-secondary-dark mb-1.5 ml-1 uppercase tracking-wider">
                Google Form URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://docs.google.com/forms/d/e/..."
                className="w-full px-4 py-3 bg-bg dark:bg-bg-dark border border-card-border dark:border-card-border-dark rounded-xl text-text-primary dark:text-text-primary-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-accent/30 focus:border-blue-accent/50 transition-all text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Open Form */}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-accent text-white rounded-xl font-bold text-sm hover:bg-blue-accent/90 transition-all shadow-sm hover:shadow-md"
              >
                <ExternalLink className="w-4 h-4" />
                Open Form
              </a>
              
              <button
                onClick={handleCopyLink}
                className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-xl font-bold text-sm text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-active-border" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
               
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
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <QRCodeCanvas 
              value={url || 'https://example.com'} 
              size={200}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <button
            onClick={handleDownload}
            className="mt-6 flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-accent/10 text-blue-accent dark:bg-blue-accent/20 hover:bg-blue-accent hover:text-white rounded-full font-bold text-sm transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
          <p className="text-[10px] text-text-tertiary dark:text-text-tertiary-dark mt-3 text-center max-w-[200px]">
            Print and tape at front desk. Members scan → form opens on their phone.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
