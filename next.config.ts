import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    localPatterns: [{ pathname: "/uploads/**" }, { pathname: "/gym-logo.png" }],
  },
};

export default nextConfig;
