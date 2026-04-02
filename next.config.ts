import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Fix turbopack scanning Desktop due to multiple lockfiles
  serverExternalPackages: [],
};

export default nextConfig;
