import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "anhmxhfhjypvtmkuzkvw.supabase.co",
      },
    ],
  },
};

export default nextConfig;
