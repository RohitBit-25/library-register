import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Keep Next 16/Turbopack anchored to this app despite parent lockfiles.
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: [],
};

export default nextConfig;
