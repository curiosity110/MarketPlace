import type { NextConfig } from "next";

function getSupabaseHost() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl) return null;

  try {
    return new URL(rawUrl).hostname;
  } catch {
    console.warn(
      "[next.config] NEXT_PUBLIC_SUPABASE_URL is invalid. next/image remotePatterns is empty.",
    );
    return null;
  }
}

const supaHost = getSupabaseHost();

if (!supaHost) {
  console.warn(
    "[next.config] NEXT_PUBLIC_SUPABASE_URL is missing. next/image remotePatterns is empty.",
  );
}

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https" as const,
    hostname: "**",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },

  // Fix cross-origin dev warning
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://169.254.109.251:3000",
    "http://169.254.158.92:3000",
    "https://market-place-one-beige.vercel.app",
    "https://www.market-place-one-beige.vercel.app",
  ],

  images: {
    remotePatterns,
  },
};

export default nextConfig;
