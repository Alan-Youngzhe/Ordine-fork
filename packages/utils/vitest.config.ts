import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // H3-07 ratchet 地板（实测 L45/S43/F52/B39，留 2 点缓冲）。
    coverage: coverageConfig({ lines: 43, statements: 41, functions: 50, branches: 37 }),
  },
});
