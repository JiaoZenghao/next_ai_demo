import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    // SWC helpers expose ESM via Node 24's module-sync condition, while Next's
    // standalone trace currently includes only their CJS variants under pnpm.
    "/*": ["./node_modules/.pnpm/@swc+helpers@*/node_modules/@swc/helpers/esm/**/*.js"],
    "/": ["./config/ai.yaml"],
    "/api/copilotkit": ["./config/ai.yaml"],
    "/api/health/ready": ["./config/ai.yaml"],
  },
};

export default nextConfig;
