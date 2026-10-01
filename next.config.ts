import type { NextConfig } from "next";

const api = process.env.API_URL;

const config: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      encoding: false,
      ...(isServer ? {} : { fs: false }),
    };
    return config;
  },
  async rewrites() {
    return api ? [{ source: "/api/v1/:path*", destination: `${api}/api/v1/:path*` }] : [];
  },
};

export default config;
