import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  allowedDevOrigins: ['initiated-annual-chronic-dayton.trycloudflare.com'],
};


export default nextConfig;
