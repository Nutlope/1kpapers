# 1,000 AI Papers

**What does it cost to summarize a year of AI research?**

An open benchmark of 1,000 popular AI papers using DeepSeek V4 Flash on Together AI, GPT-5.6 Luna, and Claude Haiku 4.5.

<p align="center">
  <img src="docs/assets/benchmark-cover.png" alt="1,000 AI papers summarized with DeepSeek V4 Flash for $3.99 in completed-summary inference" />
</p>

The idea for this benchmark was simple: measure the real inference cost of summarizing PDFs with DeepSeek V4 Flash. We started with a few documents, then expanded the experiment to **1,000 papers, 30,681 pages, and 102.7 million extracted characters**.

---

## Results

Every model completed all 1,000 papers. DeepSeek V4 Flash produced one summary per paper for **$3.99 in model inference**, or **$0.003995 per PDF**.

<p align="center">
  <img src="docs/assets/cost-comparison.svg" alt="Cost comparison for summarizing 1,000 papers with DeepSeek V4 Flash, GPT-5.6 Luna, and Claude Haiku 4.5" />
</p>

Costs count one completed result per model and paper. Failed and superseded runs are excluded for every model.

PDF downloading, text extraction, storage, networking, and developer time are excluded. This measures the **LLM inference cost to summarize extracted PDF text**.

### A few example PDFs

These are measured DeepSeek V4 Flash costs, not estimates.

| Paper | Pages | Cost |
| --- | ---: | ---: |
| DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models | 23 | $0.002726 |
| Why Language Models Hallucinate | 36 | $0.004146 |
| Who's in Charge? Disempowerment Patterns in Real-World LLM Usage | 73 | $0.011306 |

[See every result and the complete methodology →](./FULL-RESULTS.md)

---

## Benchmark approach

The benchmark uses the same corpus and final-summary contract for all three models. Reasoning is disabled. Costs come from provider-reported token usage and prices frozen on August 5, 2026.

<p align="center">
  <img src="docs/assets/benchmark-pipeline.svg" alt="Benchmark pipeline from 1,000 public PDFs through extraction, summarization, and token-based cost measurement" />
</p>

Complete extracted text is sent in one request when it fits a conservative half-context budget. Oversized papers use a 50,000-character map/reduce fallback instead of silent truncation.

This is a cost and operational-statistics benchmark. We intentionally did not use an LLM judge, so it does not rank factual accuracy or summary quality.

---

## The corpus

The frozen corpus covers August 4, 2025 through August 4, 2026. It combines popular Hugging Face Daily Papers with verified research from OpenAI, Anthropic, DeepSeek, MiniMax, and Moonshot AI/Kimi.

- [Frozen 1,000-paper manifest](./corpus/papers.json)
- [PDF extraction profile](./corpus/full-1000-profile.json)
- [Frozen model pricing](./research/model-pricing-snapshot-2026-08-05.json)
- [Aggregate result data](./results/full-results.json)

---

## Run it

Requires Node.js 22+, pnpm, and the relevant provider API key.

```bash
pnpm install
pnpm download -- --source-file=corpus/pilot-50.json --profile=corpus/pilot-50-profile.json
pnpm benchmark -- --source-file=corpus/pilot-50.json --models=deepseek-ai/DeepSeek-V4-Flash-0731 --single-pass=true --run-id=my-run
```

## Explore the site

The benchmark and research pipeline live at the repository root. The Next.js research atlas, including its future API and MCP routes, lives in [`site/`](./site).

```bash
pnpm site:dev
```

The site reads its generated artwork, paper summaries, and search index from the public Tigris bucket. After updating summary metadata, run `pnpm storage:sync`; replacement-image commands are documented in [`docs/tigris-storage.md`](./docs/tigris-storage.md). For Vercel, configure `site` as the project root directory.

Inspired by [Nutlope/SmartPDFs](https://github.com/Nutlope/smartpdfs). Built using Together AI.
