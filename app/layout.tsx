import type { Metadata, Viewport } from "next";
import { Yatra_One, Tiro_Devanagari_Hindi, Playfair_Display, Outfit, DM_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";

const yatraOne = Yatra_One({
  subsets: ["devanagari", "latin"],
  weight: "400",
  variable: "--font-yatra",
  display: "swap",
});

const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ["devanagari", "latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-tiro",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

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

export const metadata: Metadata = {
  title: "Library Register — Seat Management",
  description: "Manage 95 library seats — registration, renewals, attendance, and analytics. Built for Gangaur Library.",
  keywords: ["library", "seat management", "registration", "attendance"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Library Register",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FEFCF9' },
    { media: '(prefers-color-scheme: dark)', color: '#120C07' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${yatraOne.variable} ${tiroDevanagari.variable} ${playfair.variable} ${outfit.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('library-theme');var d=t==='light'?false:t==='dark'?true:window.matchMedia('(prefers-color-scheme:dark)').matches;if(d){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
      <body className="min-h-full bg-[var(--bg-base)] text-[var(--text-primary)] antialiased font-body">
        <ServiceWorkerRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
