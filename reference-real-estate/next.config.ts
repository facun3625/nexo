import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: "file:./dev.db",
  },
};

export default nextConfig;
