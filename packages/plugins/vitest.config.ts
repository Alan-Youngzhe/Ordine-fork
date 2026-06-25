import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // H3-07 ratchet 地板（实测全 100，留 2 点缓冲）。
    coverage: coverageConfig({ lines: 98, statements: 98, functions: 98, branches: 98 }),
  },
});
