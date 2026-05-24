import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Keep Next 16/Turbopack anchored to this app despite parent lockfiles.
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: [],
};

export default nextConfig;
