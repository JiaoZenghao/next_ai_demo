import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    exclude: [
      ...configDefaults.exclude,
      ".pnpm-store/**",
      ".worktrees/**",
      "e2e/**",
    ],
    setupFiles: ["./src/test/setup.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/{lib,data}/**/*.{ts,tsx}"],
      exclude: [
        "src/lib/utils.ts",
        "src/{lib,data}/**/*.test.{ts,tsx}",
      ],
      thresholds: {
        perFile: true,
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
