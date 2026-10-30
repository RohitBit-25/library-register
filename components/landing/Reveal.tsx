'use client';

import { useRevealOnce } from '@/hooks/useRevealOnce';

/**
 * A section whose `.reveal` children fade up and sharpen as it scrolls in
 * (globals.css § Heavy fade-up). Give children `style={{ '--i': n }}` to stagger.
 */
export default function Reveal({ as: Tag = 'section', className, children, ...rest }: {
  as?: 'section' | 'div'; className?: string; children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRevealOnce<HTMLElement>(() => {});
  return <Tag ref={ref as React.Ref<HTMLDivElement>} data-reveal className={className} {...rest}>{children}</Tag>;
}
