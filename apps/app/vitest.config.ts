import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { coverageConfig } from "../../vitest.coverage.base.ts";

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    viteReact(),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: [
      "node_modules/",
      "src/test/",
      "src/archived/",
      "e2e/",
      "**/*.d.ts",
      "**/*.config.*",
      "**/*.stories.tsx",
      "**/storybook-static/**",
    ],
    // 实测地板（H3-07，2026-06 测得 100/100 测试通过）：lines 62.3 / stmts 62.16 /
    // funcs 54.79 / branches 51.59。floors 取略低整数，ratchet 向 80% 爬。
    coverage: coverageConfig(
      { lines: 62, statements: 62, functions: 54, branches: 51 },
      { exclude: ["**/routes/**"] },
    ),
  },
});
