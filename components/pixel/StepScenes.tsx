'use client';

import { createTimeline, stagger, steps, utils } from 'animejs';
import { useRevealOnce } from '@/hooks/useRevealOnce';
import { useLang } from '@/hooks/useLang';
import { cn } from '@/lib/utils';

/* Pixel scenes for "Joining takes a minute", drawn on a 24×24 grid so they
   stay crisp at any size. */

const PAL: Record<string, string> = {
  K: '#2B1A0E', C: '#FFFAF3', W: '#FFFFFF', P: '#F6E9D6', B: '#C9813F', D: '#A9652B',
  O: '#A65310', Y: '#E3B455', G: '#3E8A3A', L: '#9BE37C', N: '#0B2141', S: '#B79C82',
};

/** One rect per horizontal run of a colour — a sprite drawn as text rows. */
function Sprite({ rows, x = 0, y = 0 }: { rows: string[]; x?: number; y?: number }) {
  const out: React.ReactElement[] = [];
  rows.forEach((row, j) => {
    let i = 0;
    while (i < row.length) {
      const c = row[i];
      if (c === '.') { i++; continue; }
      let n = 1; while (row[i + n] === c) n++;
      out.push(<rect key={`${j}-${i}`} x={x + i} y={y + j} width={n} height={1} fill={PAL[c]} />);
      i += n;
    }
  });
  return <>{out}</>;
}
const R = ({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: string }) => <rect x={x} y={y} width={w} height={h} fill={PAL[c]} />;

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <>
      <R x={5} y={1} w={14} h={22} c="K" />
      <R x={6} y={2} w={12} h={20} c="N" />
      <R x={7} y={4} w={10} h={15} c="P" />
      <R x={10} y={3} w={4} h={1} c="S" />
      <R x={10} y={20} w={4} h={1} c="S" />
      <R x={7} y={4} w={10} h={2} c="O" />
      {children}
    </>
  );
}

const ARROW = ['K...', 'KK..', 'KWK.', 'KWWK', 'KWKK', 'K...'];
const PLANE = ['....KK', '..KKWK', 'KKWWWK', '.KKWK.', '...KK.'];
const COIN = ['.DD.', 'DYYD', 'DYYD', '.DD.'];
const TICK = ['KKKKKK', 'KGGGGK', 'KGGGWK', 'KWGWGK', 'KGWGGK', 'KKKKKK'];

function PickScene() {
  const desks: [number, number][] = [];
  for (const x of [8, 11, 14]) for (const y of [7, 10, 13, 16]) desks.push([x, y]);
  return (
    <Phone>
      {desks.map(([x, y]) => (x === 11 && y === 13 ? null : <R key={`${x}${y}`} x={x} y={y} w={2} h={2} c={(x + y) % 3 ? 'B' : 'S'} />))}
      <g data-part="pick"><R x={11} y={13} w={2} h={2} c="G" /><R x={11} y={13} w={1} h={1} c="L" /></g>
      <g data-part="spark"><R x={10} y={12} w={1} h={1} c="Y" /><R x={13} y={12} w={1} h={1} c="Y" /><R x={10} y={15} w={1} h={1} c="Y" /><R x={13} y={15} w={1} h={1} c="Y" /></g>
      <g data-part="tap"><Sprite rows={ARROW} x={13} y={15} /></g>
    </Phone>
  );
}

function SendScene() {
  return (
    <Phone>
      <R x={8} y={8} w={8} h={3} c="K" /><R x={9} y={9} w={6} h={1} c="W" /><R x={9} y={9} w={3} h={1} c="S" />
      <R x={8} y={12} w={8} h={3} c="K" /><R x={9} y={13} w={6} h={1} c="W" /><R x={9} y={13} w={5} h={1} c="S" />
      <R x={8} y={16} w={8} h={2} c="O" /><R x={11} y={16} w={2} h={1} c="Y" />
      <g data-part="trail"><R x={16} y={12} w={1} h={1} c="Y" /><R x={18} y={9} w={1} h={1} c="Y" /></g>
      <g data-part="sent"><R x={9} y={16} w={6} h={2} c="G" /><Sprite rows={['..W', 'WW.']} x={11} y={16} /></g>
      <g data-part="plane"><Sprite rows={PLANE} x={14} y={13} /></g>
    </Phone>
  );
}

function PayScene() {
  return (
    <>
      <R x={4} y={4} w={8} h={8} c="K" /><R x={5} y={5} w={6} h={6} c="W" />
      <R x={5} y={5} w={2} h={2} c="N" /><R x={9} y={5} w={2} h={2} c="N" /><R x={5} y={9} w={2} h={2} c="N" />
      <R x={8} y={8} w={1} h={1} c="N" /><R x={9} y={9} w={2} h={1} c="N" /><R x={7} y={7} w={1} h={2} c="N" />
      <R x={1} y={12} w={22} h={1} c="K" /><R x={1} y={13} w={22} h={2} c="D" /><R x={2} y={15} w={20} h={6} c="B" />
      <R x={1} y={15} w={1} h={7} c="K" /><R x={22} y={15} w={1} h={7} c="K" /><R x={1} y={21} w={22} h={1} c="K" />
      <R x={4} y={16} w={7} h={4} c="D" /><R x={13} y={16} w={7} h={4} c="D" /><R x={7} y={17} w={1} h={1} c="Y" /><R x={16} y={17} w={1} h={1} c="Y" />
      <Sprite rows={['DDDD', 'YYYY']} x={17} y={10} />
      <g data-part="coin"><Sprite rows={COIN} x={13} y={8} /></g>
      <g data-part="tick"><Sprite rows={TICK} x={17} y={2} /></g>
    </>
  );
}

const STEPS = [
  { Scene: PickScene, text: 'Pick a green desk on the live seat plan.' },
  { Scene: SendScene, text: 'Send your name and phone number. No account needed.' },
  { Scene: PayScene, text: 'Pay at the desk by UPI or cash. The seat is yours.' },
];

export default function StepScenes({ className }: { className?: string }) {
  const { t } = useLang();
  const ref = useRevealOnce<HTMLOListElement>((root) => {
    const q = (s: string) => root.querySelectorAll<SVGGElement>(`[data-part="${s}"]`);
    const cards = root.querySelectorAll<HTMLElement>('[data-card]');
    utils.set(cards, { opacity: 0, translateY: 24 });
    utils.set(q('tap'), { translateX: 5, translateY: 5, opacity: 0 });
    utils.set([...q('spark'), ...q('trail'), ...q('tick'), ...q('sent')], { opacity: 0 });
    utils.set(q('tick'), { scale: 0 });
    utils.set(q('coin'), { translateY: -9, opacity: 0 });
    const tl = createTimeline({ defaults: { ease: 'out(3)' } })
      .add(cards, { opacity: 1, translateY: 0, duration: 500, delay: stagger(140) })
      // 1 · the pointer lands on a desk, which turns green
      .add(q('tap'), { translateX: 0, translateY: 0, opacity: 1, duration: 500 }, 500)
      .add(q('tap'), { scale: [1, 0.8, 1], duration: 260, ease: 'inOut(2)' })
      .add(q('pick'), { opacity: [1, 0.25, 1, 0.25, 1], duration: 900, ease: steps(4) }, '<<')
      .add(q('spark'), { opacity: [0, 1, 0, 1], duration: 900, ease: steps(3) }, '<<')
      // 2 · the request flies off
      .add(q('plane'), { translateX: [0, 9], translateY: [0, -13], opacity: [1, 1, 0], duration: 950, ease: 'in(2)' }, 1000)
      .add(q('trail'), { opacity: [0, 1, 0], duration: 950, ease: steps(3) }, '<<')
      .add(q('sent'), { opacity: [0, 1], duration: 300, ease: steps(2) })
      // 3 · the fee is paid, the desk is yours
      .add(q('coin'), { translateY: 0, opacity: 1, duration: 600, ease: 'outBounce' }, 1400)
      .add(q('tick'), { scale: [0, 1.25, 1], opacity: 1, duration: 500, ease: 'out(2)' });
    return () => { tl.pause(); };
  });

  return (
    <ol ref={ref} data-reveal className={cn('grid gap-5 md:grid-cols-3', className)}>
      {STEPS.map(({ Scene, text }, i) => (
        <li key={text} data-card className="rv bezel">
          <div className="bezel-core flex h-full flex-col p-6">
            <div className="flex items-center justify-center rounded-[1.25rem] bg-[var(--warm-band)] py-6 shadow-[inset_0_0_0_1px_rgb(168_111_28/0.18)]">
              <svg viewBox="0 0 24 24" shapeRendering="crispEdges" className="size-[144px] sm:size-[168px] [&_g]:[transform-box:fill-box] [&_g]:[transform-origin:center]" aria-hidden="true">
                <Scene />
              </svg>
            </div>
            <p className="mt-6 flex items-baseline gap-4 text-md text-[var(--warm-ink-2)]">
              <span className="shrink-0 font-editorial text-[2.6rem] leading-none text-[var(--brand-gold)]">{i + 1}</span>
              <span>{t(text)}</span>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
