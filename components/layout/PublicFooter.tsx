import Link from 'next/link';

/** The student pages' footer: name, place and hours, the three doors. */
export default function PublicFooter() {
  return (
    <footer className="border-t-4 border-[var(--warm-ink)] bg-[var(--warm-ink)] text-[var(--warm-bg)]">
      <div className="mx-auto flex max-w-[1160px] flex-col gap-4 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-pixel text-lg font-semibold uppercase">
          Shree Gangaur Library <span className="font-devanagari normal-case">· श्री गणगौर</span>
        </p>
        <p className="text-sm text-[var(--warm-on-saffron)]">Rajsamand, Rajasthan · 6 AM – 10 PM daily</p>
        <nav aria-label="Footer" className="flex gap-6 text-sm">
          <Link href="/browse" className="hover:underline">Seats</Link>
          <Link href="/my-requests" className="hover:underline">My requests</Link>
          <Link href="/admin/login" className="hover:underline">Staff sign in</Link>
        </nav>
      </div>
    </footer>
  );
}
