import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // H3-07 ratchet 地板（实测 L98/S98/F90/B100，留 2 点缓冲）。
    coverage: coverageConfig({ lines: 96, statements: 96, functions: 88, branches: 98 }),
  },
});
