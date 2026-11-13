import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Que Next avise de actualizaciones de seguridad (lo pide next upgrade --agent=security)
  experimental: {
    agentUpgrade: "security",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
