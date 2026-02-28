import type { NextConfig } from "next";

const supaHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

if (!supaHost) {
  console.warn(
    "[next.config] NEXT_PUBLIC_SUPABASE_URL is missing. next/image remotePatterns is empty.",
  );
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: supaHost
      ? [{ protocol: "https", hostname: supaHost }]
      : [],
  },
};

export default nextConfig;
