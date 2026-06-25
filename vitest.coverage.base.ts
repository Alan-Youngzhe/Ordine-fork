/**
 * 共享覆盖率门禁底座（H3-07）。CodeGuidelines §12 声明最低 80% 覆盖率，但 13 个
 * vitest.config 此前 0 个设 thresholds —— 门禁形同虚设。此处把"provider + exclude +
 * 阈值 + 始终开启"收敛为一份，各包以测得地板接入，CI 跑 `vitest run` 即强制。
 *
 * ratchet：floors 设为**当前实测覆盖率**（略低取整），只能涨不能跌，逐步逼近 80%。
 * 修复测试缺口后上调 floors；新代码若拉低覆盖率到地板以下，CI 失败。
 *
 * `enabled: true` 让普通 `vitest run`（turbo test 任务）即收集并强制阈值，无须在
 * 每个 package.json 改 test 命令或动 CI yaml —— 报告所要求的"接入 turbo test 任务"。
 */

export interface CoverageFloors {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
}

export interface CoverageBaseOptions {
  /** 额外排除的 glob（叠加在默认排除之上）。 */
  exclude?: readonly string[];
  /**
   * 覆盖统计范围。省略则用 vitest 默认（仅统计被测试引用到的文件）——与地板测量口径
   * 一致。传 `["src/**\/*.{ts,tsx}"]` 则强制全部 src 入分母（未测文件计 0%），口径更严，
   * 仅在已确认仍达标的包（如 apps/app）使用。
   */
  include?: readonly string[];
}

const DEFAULT_EXCLUDE = [
  "node_modules/",
  "**/*.d.ts",
  "**/*.config.*",
  "**/*.test.*",
  "**/*.spec.*",
  "**/*.stories.*",
  "**/index.ts",
  "**/*.gen.ts",
  "src/test/",
  "src/archived/",
  "**/storybook-static/**",
];

/** 返回可直接塞进 vitest `test.coverage` 的配置块。 */
export const coverageConfig = (floors: CoverageFloors, opts: CoverageBaseOptions = {}) => ({
  enabled: true,
  provider: "v8" as const,
  reporter: ["text-summary", "json-summary"] as const,
  ...(opts.include ? { include: [...opts.include] } : {}),
  exclude: [...DEFAULT_EXCLUDE, ...(opts.exclude ?? [])],
  thresholds: { ...floors },
});
