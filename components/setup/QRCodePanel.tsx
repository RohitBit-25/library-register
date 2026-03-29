'use client';

import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { motion } from 'framer-motion';

interface QRCodePanelProps {
  initialUrl?: string;
  defaultMessage?: string;
}

export default function QRCodePanel({ 
  initialUrl = 'https://forms.gle/your-form-link',
  defaultMessage = 'Join our library — fill this form to get a seat: '
}: QRCodePanelProps) {
  const [url, setUrl] = useState(initialUrl);
  const { addToast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

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
      className="bg-surface dark:bg-surface-dark border-2 border-card-border dark:border-card-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col md:flex-row"
    >
      {/* Left side: Input & Actions */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-b md:border-b-0 md:border-r border-card-border dark:border-card-border-dark bg-bg/30 dark:bg-bg-dark/30">
        <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-2">
          Registration QR Code
        </h2>
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
          Paste your Google Form link below to easily share it with new members at the front desk.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary dark:text-text-primary-dark mb-1 ml-1 uppercase tracking-wider">
              Google Form URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://forms.gle/..."
              className="w-full px-4 py-3 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-lg text-text-primary dark:text-text-primary-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-accent transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
             <button
               onClick={handleCopyLink}
               className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-surface dark:bg-surface-dark border border-card-border dark:border-card-border-dark rounded-lg font-semibold text-text-primary dark:text-text-primary-dark hover:bg-bg dark:hover:bg-bg-dark transition-colors"
             >
               {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
               {copied ? 'Copied!' : 'Copy Link'}
             </button>
             
             <a
               href={whatsappUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-sm"
             >
               <Share2 className="w-4 h-4" />
               Share via WhatsApp
             </a>
          </div>
        </div>
      </div>

      {/* Right side: QR Display */}
      <div className="p-8 flex flex-col items-center justify-center bg-white dark:bg-[#121210]">
        <div 
          ref={qrRef}
          className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 dark:border-gray-800"
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
          className="mt-6 flex items-center justify-center gap-2 px-6 py-2 bg-blue-accent/10 text-blue-accent dark:bg-blue-accent/20 dark:text-blue-accent hover:bg-blue-accent hover:text-white rounded-full font-bold text-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Download PNG
        </button>
      </div>
    </motion.div>
  );
}
