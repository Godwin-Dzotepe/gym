import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/gym-logo.png" }],
  },
};

export default nextConfig;
