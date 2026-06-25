import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    exclude: ["**/archived/**", "**/node_modules/**"],
    // H3-07 ratchet 地板（实测 L93/S92/F94/B68，留 2 点缓冲）。
    coverage: coverageConfig({ lines: 91, statements: 90, functions: 92, branches: 66 }),
  },
});
