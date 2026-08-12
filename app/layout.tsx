import type { Metadata, Viewport } from "next";
import { Outfit, DM_Mono, Cormorant_Garamond, Tiro_Devanagari_Hindi } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

// Display serif for the landing page. Previously loaded by a render-blocking
// @import inside the component's <style> tag, which next/font could not
// preload and which shipped on every route.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Neither Outfit nor Cormorant covers Devanagari, so "श्री गणगौर" was falling
// back to whatever the OS happened to have.
const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari"],
  weight: ["400"],
  variable: "--font-devanagari-hindi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Library Register — Seat Management",
  description: "Manage 95 library seats — registration, renewals, attendance, and analytics. Built for Gangaur Library.",
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
  themeColor: "#FBFAF8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${outfit.variable} ${dmMono.variable} ${cormorant.variable} ${tiroDevanagari.variable}`}
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
