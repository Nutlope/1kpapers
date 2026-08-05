import type { ModelConfig } from "./types.js";

export const MODELS: ModelConfig[] = [
  {
    id: "deepseek-ai/DeepSeek-V4-Flash-0731",
    label: "DeepSeek V4 Flash",
    provider: "together",
    inputUsdPerMillion: 0.14,
    outputUsdPerMillion: 0.28,
    contextWindowTokens: 1_048_576,
    pricingRetrievedAt: "2026-08-05",
    pricingMode: "standard-synchronous",
    pricingSource: "https://api.together.xyz/v1/models",
  },
  {
    id: "Qwen/Qwen3.5-9B",
    label: "Qwen3.5 9B",
    provider: "together",
    inputUsdPerMillion: 0.17,
    outputUsdPerMillion: 0.25,
    contextWindowTokens: 262_144,
    pricingRetrievedAt: "2026-08-05",
    pricingMode: "standard-synchronous",
    pricingSource: "https://docs.together.ai/docs/serverless/models",
  },
  {
    id: "MiniMaxAI/MiniMax-M3",
    label: "MiniMax M3",
    provider: "together",
    inputUsdPerMillion: 0.3,
    outputUsdPerMillion: 1.2,
    contextWindowTokens: 524_288,
    pricingRetrievedAt: "2026-08-05",
    pricingMode: "standard-synchronous",
    pricingSource: "https://docs.together.ai/docs/serverless/models",
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    inputUsdPerMillion: 1,
    outputUsdPerMillion: 5,
    contextWindowTokens: 200_000,
    pricingRetrievedAt: "2026-08-05",
    pricingMode: "standard-synchronous",
    pricingSource: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    provider: "openai",
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.2,
    contextWindowTokens: 1_050_000,
    pricingRetrievedAt: "2026-08-05",
    pricingMode: "standard-synchronous",
    pricingSource: "https://developers.openai.com/api/docs/pricing",
  },
];

export function calculateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number,
) {
  return (
    (inputTokens * model.inputUsdPerMillion +
      outputTokens * model.outputUsdPerMillion) /
    1_000_000
  );
}
