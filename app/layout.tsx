import type { Metadata, Viewport } from "next";
import { Cinzel, Geist, Geist_Mono, Instrument_Serif, Noto_Sans_Devanagari, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

// One family, display to table cell (design.md). Geist sets tight at display
// sizes and stays legible at 12px, which is where most of the admin lives.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Hindi in the UI face. The Devanagari subset only downloads when a page
// actually shows Hindi (the student pages' हिंदी toggle).
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  variable: "--font-noto-deva",
  display: "swap",
});

// Geist does not cover Devanagari, so "श्री गणगौर" was falling
// back to whatever the OS happened to have.
const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari"],
  weight: ["400"],
  variable: "--font-devanagari-hindi",
  display: "swap",
});

// The emblem's lettering is a classical inscriptional serif; Cinzel matches
// it. Brand lockups only (the name next to the emblem) — never body text.
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

// High-contrast serif for the landing's large headings (design.md § Landing).
// Roman only — headings are never italic.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shree Gangaur Library · Kankroli, Rajsamand",
  description: "95 reserved study desks in one cool, quiet hall at JK Circle, Kankroli. See free desks live, request yours, and pay at the desk by UPI or cash. Open 6 AM – 10 PM daily.",
  keywords: ["Shree Gangaur Library", "study library", "Kankroli", "Rajsamand", "reading hall", "library seat"],
  openGraph: {
    title: "Shree Gangaur Library",
    description: "95 reserved study desks in Kankroli, Rajsamand. See free desks live and request yours.",
    type: "website",
    locale: "en_IN",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gangaur Library",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale: pinch-zoom must stay available so users can enlarge text
  // (WCAG 1.4.4). Capping it at 1 blocked that entirely.
  themeColor: "#F6F7F9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${geist.variable} ${geistMono.variable} ${notoDevanagari.variable} ${tiroDevanagari.variable} ${cinzel.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)] antialiased font-body">
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
