/**
 * 共享目录遍历（H3-03）。把原先在 check-boundaries / check-file-size /
 * check-i18n-dead-keys / check-schema-exports 各自复制、且 ignore 规则已漂移的
 * `walk` 递归收敛为一份实现，修遍历 bug 只需改这里。
 *
 * 设计取舍：ignore 规则**不**在此统一——各 check 的扫描范围本就不同（i18n 要排
 * locales/test、schema 要排 .agents），由调用方各自传入 IGNORE_DIRS 以保持原行为。
 * 这里只抽掉重复的"递归 + 跳过目录 + 扩展名/文件名过滤"骨架。
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";

export interface WalkSourcesOptions {
  /** 命中即不下钻的目录名（按 basename 比较）。 */
  ignoreDirs: ReadonlySet<string>;
  /** 命中即跳过的文件名正则（测试/故事/声明文件等）。可选。 */
  ignoreFileRe?: RegExp;
  /** 收集的扩展名（不含点），默认 ["ts", "tsx"]。 */
  extensions?: readonly string[];
}

/**
 * 自 `roots` 起前序 DFS 收集源文件，跳过 `ignoreDirs` 子树与 `ignoreFileRe` 文件。
 * 遍历顺序与各 check 脚本原实现一致（按 readdir 顺序、目录就地下钻）。
 */
export function walkSources(
  roots: string | readonly string[],
  { ignoreDirs, ignoreFileRe, extensions = ["ts", "tsx"] }: WalkSourcesOptions,
): string[] {
  const extRe = new RegExp(`\\.(${extensions.join("|")})$`);
  const out: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) visit(full);
        continue;
      }
      if (extRe.test(entry.name) && !ignoreFileRe?.test(entry.name)) out.push(full);
    }
  };
  for (const root of typeof roots === "string" ? [roots] : roots) visit(root);

  return out;
}

/**
 * 自 `root` 起递归收集所有目录路径（跳过 `ignoreDirs`）。
 * 供 check-schema-exports 定位所有 `schemas/` 目录使用。
 */
export function walkDirs(root: string, ignoreDirs: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || ignoreDirs.has(entry.name)) continue;
      const full = join(dir, entry.name);
      out.push(full);
      visit(full);
    }
  };
  visit(root);

  return out;
}
