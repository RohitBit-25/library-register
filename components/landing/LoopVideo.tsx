'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/hooks/useLang';

/**
 * A short, silent clip of the real hall that loops while it is on screen.
 * Reduced-motion visitors get the still poster; everyone gets a pause button
 * (anything moving for more than five seconds must be stoppable).
 */
export default function LoopVideo({ src, poster, label, className, videoClassName }: {
  src: string; poster: string; label: string; className?: string; videoClassName?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Paused by the visitor or by reduced motion: never restart on scroll.
    const userStopped = () => reduced.matches || v.dataset.userPaused === '1';
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userStopped()) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.2 });
    io.observe(v);
    const onState = () => setPaused(v.paused);
    v.addEventListener('play', onState);
    v.addEventListener('pause', onState);
    return () => { io.disconnect(); v.removeEventListener('play', onState); v.removeEventListener('pause', onState); };
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) { v.dataset.userPaused = '0'; v.play().catch(() => {}); }
    else { v.dataset.userPaused = '1'; v.pause(); }
  };

  return (
    <div className={cn('relative', className)}>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
        className={cn('h-full w-full object-cover', videoClassName)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={paused ? t('Play video') : t('Pause video')}
        className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-[var(--brand-navy-deep)]/70 text-[var(--crest-on-navy)] backdrop-blur-sm transition-colors hover:bg-[var(--brand-navy-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold-light)]"
      >
        {paused ? <Play className="size-4" strokeWidth={2} aria-hidden="true" /> : <Pause className="size-4" strokeWidth={2} aria-hidden="true" />}
      </button>
    </div>
  );
}
