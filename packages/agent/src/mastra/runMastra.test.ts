import { describe, expect, it } from "vitest";
import { runMastra } from "./runMastra";

describe("runMastra with Kimi", () => {
  const apiKey = process.env.KIMI_API_KEY;

  it.skipIf(!apiKey)("returns text from Kimi model", async () => {
    const result = await runMastra({
      systemPrompt: "You are a helpful assistant.",
      userPrompt: "Say exactly the word 'pong' and nothing else.",
      cwd: process.cwd(),
      apiKey,
      model: "kimi-k2-0711-preview",
      timeoutMs: 60_000,
    });

    expect(result.text.length).toBeGreaterThan(0);
    expect(result.events).toEqual([]);
  });

  it.skipIf(!apiKey)("respects custom system prompt", async () => {
    const result = await runMastra({
      systemPrompt: "You only respond in lowercase.",
      userPrompt: "Say HELLO.",
      cwd: process.cwd(),
      apiKey,
      model: "kimi-k2-0711-preview",
      timeoutMs: 60_000,
    });

    expect(result.text.length).toBeGreaterThan(0);
  });

  // 缺 key 时默认 Kimi 模型应 fast-fail 并给出清晰提示（RUN-06）。断言真实消息而非环境依赖串；
  // 本机若恰好配了 KIMI_API_KEY 则无法触发缺 key 路径，跳过（与上面两测的 skipIf 同理）。
  it.skipIf(apiKey)("throws a clear error when KIMI_API_KEY is missing", async () => {
    await expect(
      runMastra({
        systemPrompt: "sys",
        userPrompt: "user",
        cwd: process.cwd(),
        timeoutMs: 1000,
      }),
    ).rejects.toThrow(/KIMI_API_KEY 未配置/);
  });
});
