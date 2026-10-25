import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Keep Next 16/Turbopack anchored to this app despite parent lockfiles.
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: [],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Nobody can frame the app — no clickjacking the staff desk.
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // The camera is used for the ID photo on the request form; nothing
          // here needs the microphone, location or payment APIs.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
      {
        // Keep the staff door out of search results.
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
