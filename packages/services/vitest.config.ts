import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  plugins: [
    {
      name: "md-text-import",
      transform(_, id) {
        if (id.endsWith(".md")) {
          return `export default ${JSON.stringify(readFileSync(id, "utf8"))}`;
        }
      },
    },
  ],
  test: {
    globals: false,
    environment: "node",
    // H3-07 ratchet 地板（实测 L83/S80/F77/B64，留 2 点缓冲）。
    coverage: coverageConfig({ lines: 81, statements: 78, functions: 75, branches: 62 }),
  },
});
