import type { ModelConfig } from "./types.js";

export const MODELS: ModelConfig[] = [
  {
    id: "deepseek-ai/DeepSeek-V4-Flash-0731",
    label: "DeepSeek V4 Flash",
    provider: "together",
    inputUsdPerMillion: 0.14,
    outputUsdPerMillion: 0.28,
    pricingSource: "https://api.together.xyz/v1/models",
  },
  {
    id: "moonshotai/Kimi-K3",
    label: "Kimi K3",
    provider: "together",
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
    pricingSource: "https://api.together.xyz/v1/models",
  },
  {
    id: "zai-org/GLM-5.2",
    label: "GLM 5.2",
    provider: "together",
    inputUsdPerMillion: 1.4,
    outputUsdPerMillion: 4.4,
    pricingSource: "https://api.together.xyz/v1/models",
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    inputUsdPerMillion: 1,
    outputUsdPerMillion: 5,
    pricingSource: "https://platform.claude.com/docs/en/about-claude/pricing",
  },
  {
    id: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    provider: "openai",
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.2,
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
