import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  images: {
    remotePatterns: [{ hostname: "*.public.blob.vercel-storage.com" }],
  },
};

export default nextConfig;
