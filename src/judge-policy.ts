const CONSERVATIVE_CHARACTERS_PER_TOKEN = 3;

export function estimateJudgeInputTokens(inputCharacters: number) {
  return Math.ceil(inputCharacters / CONSERVATIVE_CHARACTERS_PER_TOKEN);
}

export function judgeContextDecision(input: {
  inputCharacters: number;
  contextWindowTokens: number;
  maxOutputTokens: number;
}) {
  const estimatedInputTokens = estimateJudgeInputTokens(input.inputCharacters);
  const availableInputTokens =
    input.contextWindowTokens - input.maxOutputTokens;
  return {
    estimatedInputTokens,
    availableInputTokens,
    fits: estimatedInputTokens <= availableInputTokens,
  };
}
