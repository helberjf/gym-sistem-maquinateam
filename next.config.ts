import type { NextConfig } from "next";

const r2PublicUrl =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? null;
const r2RemotePattern = r2PublicUrl
  ? (() => {
      const parsed = new URL(r2PublicUrl);

      return {
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
      };
    })()
  : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: r2RemotePattern ? [r2RemotePattern] : [],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
