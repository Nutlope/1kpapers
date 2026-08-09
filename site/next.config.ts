import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: true,
  images: {
    qualities: [50, 75],
    remotePatterns: [{
      protocol: "https",
      hostname: "year-in-ai-papers.t3.tigrisfiles.io",
    }],
  },
};

export default nextConfig;
