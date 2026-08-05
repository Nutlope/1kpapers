export type Source = {
  id: string;
  title: string;
  kind: string;
  landingPage: string;
  pdfUrl: string;
  publisher: string;
  availability: string;
  rank?: number;
  arxivId?: string;
  officialLab?: string | null;
  hfUpvotes?: number;
  topicTags?: string[];
};

export type DocumentInfo = Source & {
  path: string;
  sha256: string;
  bytes: number;
  pages: number;
  characters: number;
  chunks: string[];
};

export type ProviderName = "together" | "anthropic" | "openai";

export type ModelConfig = {
  id: string;
  label: string;
  provider: ProviderName;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  contextWindowTokens: number;
  pricingRetrievedAt: string;
  pricingMode: "standard-synchronous";
  pricingSource: string;
};

export type Usage = {
  inputTokens: number;
  outputTokens: number;
};

export type Inference = {
  title: string;
  summary: string;
  usage: Usage;
  latencyMs: number;
  finishReason: string | null;
  attempts: number;
  normalized: boolean;
};

export type RequestResult = Inference & {
  stage: "chunk" | "reduce";
  chunkIndex: number | null;
  costUsd: number;
};

export type BenchmarkRow = {
  source: Omit<DocumentInfo, "chunks" | "path">;
  model: ModelConfig;
  status: "ok" | "failed" | "skipped";
  requests: RequestResult[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalLatencyMs: number;
  withinThirtySeconds: boolean;
  finalTitle: string | null;
  finalSummary: string | null;
  error: string | null;
};
