import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'gold' | 'navy' | 'ghost-light' | 'ghost-dark';

/**
 * The landing's button: a pill whose arrow sits in its own circle and leans
 * forward on hover (globals.css § CREST). Internal hrefs use next/link.
 */
export default function PillLink({ href, tone = 'gold', className, children, external }: {
  href: string; tone?: Tone; className?: string; children: React.ReactNode; external?: boolean;
}) {
  const cls = cn('pill-btn group', `pill-btn--${tone}`, className);
  const inner = (
    <>
      <span>{children}</span>
      <span className="pill-btn__icon" aria-hidden="true"><ArrowUpRight className="size-[18px]" strokeWidth={1.5} /></span>
    </>
  );
  return external || href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http')
    ? <a href={href} className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}
