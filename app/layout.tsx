import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Tiro_Devanagari_Hindi } from "next/font/google";
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

// Geist does not cover Devanagari, so "श्री गणगौर" was falling
// back to whatever the OS happened to have.
const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari"],
  weight: ["400"],
  variable: "--font-devanagari-hindi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shree Gangaur Study Library",
  description: "Manage 93 library seats — registration, renewals, attendance, and analytics. Built for Gangaur Library.",
  keywords: ["library", "seat management", "registration", "attendance"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Library Register",
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
      className={`h-full ${geist.variable} ${geistMono.variable} ${tiroDevanagari.variable}`}
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
