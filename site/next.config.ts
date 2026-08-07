import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "year-in-ai-papers.t3.tigrisfiles.io",
    }],
  },
};

export default nextConfig;
