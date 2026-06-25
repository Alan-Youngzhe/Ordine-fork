#!/usr/bin/env tsx
/**
 * neverthrow 纪律守护（H3-04）。把 CodeGuidelines Convention 2「业务码不裸 throw、
 * 返回 ResultAsync + 具名 Error」与「前端不用 promise .catch 吞错」机器化。
 *
 * 这是一道 **ratchet（棘轮）门禁**，与 check-file-size 的 DEBT_ALLOWLIST 同理：
 *   - scripts/no-throw-baseline.json 记录每个文件当前的违规**条数**（既有债务快照）。
 *   - CI 只在某文件违规数**超过基线**时失败 —— 即只拦"新增"，不拦存量。
 *   - 修掉存量后跑 `--update` 把基线下调；基线只减不增，逐步逼近 0。
 *
 * 为什么用 per-file 计数而非 file:line：行号会随上方编辑漂移，计数对重排稳定，
 * 且天然 ratchet（修掉一处计数就降）。
 *
 * 扫描范围刻意收敛在"Convention 2 严格适用"的层：service / 引擎 / cli / scripts /
 * server / app 的 integrations 子树。前端 routes 的 `throw redirect()`（TanStack 控制流）
 * 与 store 的 context-guard throw（报告明确推荐）不在 throw 规则内，只用 .catch 规则覆盖前端。
 *
 * Usage:
 *   node --experimental-strip-types scripts/check-no-throw.ts            # 校验
 *   node --experimental-strip-types scripts/check-no-throw.ts --update   # 重写基线
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { walkSources } from "./lib/walkSources.ts";

const ROOT = join(import.meta.dirname ?? new URL(".", import.meta.url).pathname, "..");
const BASELINE_PATH = join(ROOT, "scripts/no-throw-baseline.json");

const IGNORE_DIRS = new Set(["node_modules", "archived", "dist", ".turbo", "storybook-static"]);
const IGNORE_FILE_RE =
  /\.(unit|integration)\.test\.|\.test\.|\.spec\.|\.stories\.|\.d\.ts$|\.gen\.ts$/;
/** 注释行不计入（避免示例/文档里的 throw 误报）。 */
const COMMENT_RE = /^\s*(\/\/|\*|\/\*)/;

interface Rule {
  id: string;
  label: string;
  /** 相对仓库根的扫描目录。 */
  roots: readonly string[];
  re: RegExp;
}

const RULES: readonly Rule[] = [
  {
    id: "throw",
    label: "裸 throw —— 业务码应返回 ResultAsync / err(new NamedError) 而非抛异常",
    roots: [
      "packages/services/src",
      "packages/agent/src",
      "packages/pipeline-engine/src",
      "packages/agent-engine/src",
      "apps/cli/src",
      "apps/scripts/src",
      "apps/server/src",
      "apps/app/src/integrations",
    ],
    re: /\bthrow\s/,
  },
  {
    id: "catch",
    label: "promise .catch() —— 应经 ResultAsync.match / isErr 处理 typed error",
    roots: [
      "apps/app/src",
      "packages/services/src",
      "apps/server/src",
      "apps/cli/src",
      "apps/scripts/src",
      "packages/agent/src",
    ],
    re: /\.catch\s*\(/,
  },
];

const countMatches = (file: string, re: RegExp): number => {
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  let count = 0;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (COMMENT_RE.test(line)) continue;
    count += line.match(global)?.length ?? 0;
  }

  return count;
};

/** 当前每个 `${ruleId}\t${relPath}` 的违规条数（>0 才记录）。 */
const current: Record<string, number> = {};
for (const rule of RULES) {
  const roots = rule.roots.map((d) => join(ROOT, d)).filter((d) => existsSync(d));
  for (const file of walkSources(roots, {
    ignoreDirs: IGNORE_DIRS,
    ignoreFileRe: IGNORE_FILE_RE,
  })) {
    const n = countMatches(file, rule.re);
    if (n > 0) current[`${rule.id}\t${relative(ROOT, file)}`] = n;
  }
}

const sortedEntries = (obj: Record<string, number>): [string, number][] =>
  Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));

if (process.argv.includes("--update")) {
  const sorted = Object.fromEntries(sortedEntries(current));
  writeFileSync(BASELINE_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(
    `[check-no-throw] 已写基线：${Object.keys(sorted).length} 个文件，路径 ${relative(ROOT, BASELINE_PATH)}`,
  );
  process.exit(0);
}

const baseline: Record<string, number> = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, "utf8"))
  : {};

const regressions: string[] = [];
const repaid: string[] = [];
for (const [key, count] of sortedEntries(current)) {
  const allowed = baseline[key] ?? 0;
  if (count > allowed) {
    const [ruleId, file] = key.split("\t");
    const rule = RULES.find((r) => r.id === ruleId)!;
    regressions.push(`  ✗ ${file}: ${ruleId} ${allowed} → ${count}（${rule.label}）`);
  }
}
for (const [key, allowed] of sortedEntries(baseline)) {
  const count = current[key] ?? 0;
  if (count < allowed) {
    const [, file] = key.split("\t");
    repaid.push(`  · ${file}: ${allowed} → ${count}`);
  }
}

if (repaid.length > 0) {
  console.log(`[check-no-throw] ${repaid.length} 个文件已偿还存量（可跑 --update 下调基线）：`);
  console.log(repaid.join("\n"));
}

if (regressions.length > 0) {
  console.error(`\n[check-no-throw] ${regressions.length} 处新增 throw/.catch 违规：`);
  console.error(regressions.join("\n"));
  console.error(
    "\n业务码请返回 ResultAsync + 具名 Error；前端走 useCustomMutation/.match()。" +
      "\n若确属合理（如框架边界），修掉别处再 --update，或在该文件以 Result.fromThrowable 包裹。\n",
  );
  process.exit(1);
}

const total = Object.values(current).reduce((a, b) => a + b, 0);
console.log(`[check-no-throw] OK — 无新增违规（基线内存量 ${total} 处，只减不增）。`);
