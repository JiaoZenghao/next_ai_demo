import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./config/ai.yaml"],
    "/api/copilotkit": ["./config/ai.yaml"],
  },
};

export default nextConfig;
