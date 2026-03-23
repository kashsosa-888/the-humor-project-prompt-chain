import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "images.almostcrackd.ai" },
      { hostname: "presigned-url-uploads.almostcrackd.ai" },
      { hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
