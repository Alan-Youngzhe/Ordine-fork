import { defineConfig } from "vitest/config";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
  ],
  test: {
    globals: true,
    // H3-07 ratchet 地板（实测 L58/S59/F73/B35，留 2 点缓冲）。
    coverage: coverageConfig({ lines: 56, statements: 57, functions: 71, branches: 33 }),
  },
});
