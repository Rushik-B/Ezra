import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
  transpilePackages: ["tiktoken"], // <-- move this to top-level
  experimental: {
    serverComponentsExternalPackages: ["tiktoken"],
  },
};

export default nextConfig;
