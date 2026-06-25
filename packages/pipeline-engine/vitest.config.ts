import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // H3-07 ratchet 地板（实测 L81/S80/F81/B73，留 2 点缓冲）。
    coverage: coverageConfig({ lines: 79, statements: 78, functions: 79, branches: 71 }),
  },
});
