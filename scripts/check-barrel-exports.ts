#!/usr/bin/env tsx
/**
 * Barrel 卫生守护（H3-05）。CodeGuidelines Convention 9：`index.ts` 只做 barrel
 * re-export，统一用 `export *`，不放具名/类型再导出或业务逻辑——这样新增公共导出
 * 无须手改 barrel，export-star 不变量可被机器强制。
 *
 * ratchet：BARREL_ALLOWLIST 是既有违规快照（只减不增）。拆掉一个就删一行；
 * 新建的 barrel 一律须 export-*，否则失败。
 *
 * 不在管辖范围（非 barrel，跳过）：
 *   - 应用入口 `apps/<name>/src/index.ts`（是可运行主程序，非再导出桶）。
 *   - `.vitepress/` 主题入口（框架约定）。
 *
 * Usage: node --experimental-strip-types scripts/check-barrel-exports.ts
 */

import { readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { walkSources } from "./lib/walkSources.ts";

const ROOT = join(import.meta.dirname ?? new URL(".", import.meta.url).pathname, "..");
const IGNORE_DIRS = new Set(["node_modules", "archived", "dist", ".turbo", "storybook-static"]);

/** 应用入口与框架主题入口：是程序而非 barrel，不适用 export-star。 */
const NOT_A_BARREL_RE = /^apps\/[^/]+\/src\/index\.ts$|\.vitepress\//;

/** 既有 barrel 违规债务，只减不增（H3-05）。修成 export-* 后删除对应行。 */
const BARREL_ALLOWLIST = new Set<string>([
  "packages/services/src/pipelinesService/proposeActions/index.ts",
  "packages/plugin/src/index.ts",
  "apps/app/src/components/PipelinePreviewGraph/index.ts",
  "apps/app/src/pages/WorkspacePage/canvas/run/DecisionBoard/index.ts",
  "apps/app/src/pages/WorkspacePage/canvas/panels/ArtifactPreview/index.ts",
]);

const EXPORT_STAR_RE = /^\s*export\s+\*\s+(?:as\s+\w+\s+)?from\s+["'][^"']+["'];?\s*(?:\/\/.*)?$/;
const SKIP_LINE_RE = /^\s*(?:\/\/|\/\*|\*|\*\/|$)/;

/** 返回 barrel 中不符合 export-* 的行（已剔除空行/注释）。 */
const offendingLines = (file: string): string[] =>
  readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => !SKIP_LINE_RE.test(line) && !EXPORT_STAR_RE.test(line))
    .map((line) => line.trim());

const barrels = walkSources(
  ["apps", "packages"].map((d) => join(ROOT, d)),
  {
    ignoreDirs: IGNORE_DIRS,
  },
).filter((file) => basename(file) === "index.ts" && !NOT_A_BARREL_RE.test(relative(ROOT, file)));

const violations: string[] = [];
const staleAllowlist: string[] = [];
for (const file of barrels.sort()) {
  const rel = relative(ROOT, file);
  const bad = offendingLines(file);
  if (bad.length === 0) {
    if (BARREL_ALLOWLIST.has(rel)) staleAllowlist.push(rel);
    continue;
  }
  if (BARREL_ALLOWLIST.has(rel)) continue;
  violations.push(`  ✗ ${rel}: ${bad.length} 行非 export-*\n      e.g. ${bad[0]}`);
}

if (staleAllowlist.length > 0) {
  console.log(`[check-barrel-exports] ${staleAllowlist.length} 个 allowlist 条目已修好，可删除：`);
  for (const rel of staleAllowlist) console.log(`  · ${rel}`);
}

if (violations.length > 0) {
  console.error(`\n[check-barrel-exports] ${violations.length} 个 barrel 违反 export-* 约定：`);
  console.error(violations.join("\n"));
  console.error(
    '\nindex.ts 只用 `export * from "./x"`；具名/类型再导出请下沉到源模块，或拆成非 index 文件。\n',
  );
  process.exit(1);
}

console.log(
  `[check-barrel-exports] OK — ${barrels.length} 个 barrel 合规（${BARREL_ALLOWLIST.size} 条既有债务豁免）。`,
);
