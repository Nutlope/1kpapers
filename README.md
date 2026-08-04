# smartpdfs-bench

A reproducible benchmark for the cost, latency, reliability, and factual coverage of summarizing PDFs with current language models.

This project was inspired by [Nutlope/SmartPDFs](https://github.com/Nutlope/smartpdfs) and mirrors the summarization pipeline in [SmartPDFs PR #8](https://github.com/Nutlope/smartpdfs/pull/8): PDF.js text extraction, four-or-more chunks, parallel chunk summaries, and one final reduce pass. It measures the full language-model cost of producing the final PDF summary, not a one-shot estimate.

## Result from August 4, 2026

Across the four PDFs that DeepSeek V4 Flash, GLM 5.2, Claude Haiku 4.5, and GPT-5.6 Luna all completed—333 pages spanning a paper, presentation, and public-domain book:

| Model | Total inference cost | Relative to Flash |
| --- | ---: | ---: |
| DeepSeek V4 Flash | **$0.021711** | 1× |
| GPT-5.6 Luna | $0.036546 | 1.68× |
| Claude Haiku 4.5 | $0.221633 | 10.21× |
| GLM 5.2 | $0.237984 | 10.96× |

That is about **$0.0054, or 0.54 cents, per successfully summarized PDF** for DeepSeek V4 Flash on the shared-success corpus.

This is an inference-cost result, not a claim that every model completed every document. Kimi K3 timed out after 120 seconds on the representative NIST deck. DeepSeek, GLM, and Claude each failed at least one larger or harder document; Luna had one policy rejection. See [RESULTS.md](./RESULTS.md) for the per-PDF table, partial costs, fact checks, latencies, and exact errors.

## Corpus

The benchmark downloads six public PDFs at runtime:

- DeepSeek-V3 Technical Report, version 2
- DeepSeek-R1 paper, version 2
- Attention Is All You Need, version 7
- Alice's Adventures in Wonderland, 1890 public-domain scan
- NIST's 2026 international AI standards presentation
- Stanford's 425-page 2026 AI Index Report

PDFs are never committed. [`sources.json`](./sources.json) contains only landing pages, version-pinned download URLs, publishers, and availability notes. Each result records the SHA-256 hash, byte size, page count, and extracted character count so corpus drift is visible.

## Models and standard API prices

| Model | Provider | Input / 1M tokens | Output / 1M tokens |
| --- | --- | ---: | ---: |
| `deepseek-ai/DeepSeek-V4-Flash-0731` | Together | $0.14 | $0.28 |
| `moonshotai/Kimi-K3` | Together | $3.00 | $15.00 |
| `zai-org/GLM-5.2` | Together | $1.40 | $4.40 |
| `claude-haiku-4-5-20251001` | Anthropic | $1.00 | $5.00 |
| `gpt-5.6-luna` | OpenAI | $0.20 | $1.20 |

Prices were retrieved on August 4, 2026. The runner uses provider-reported token counts and does not assume prompt-cache or batch discounts. Source details and known catalog discrepancies are recorded in [`research/model-and-corpus-sources.md`](./research/model-and-corpus-sources.md).

## Run it

Requirements: Node.js 22+, pnpm, and normal API keys. A ChatGPT or Codex subscription is not an OpenAI API billing method.

```bash
pnpm install
cp .env.example .env
# Fill TOGETHER_API_KEY, ANTHROPIC_API_KEY, and OPENAI_API_KEY.

pnpm download
set -a && source .env && set +a
pnpm benchmark
pnpm report
```

Filter the matrix when needed:

```bash
pnpm benchmark \
  --models=deepseek-ai/DeepSeek-V4-Flash-0731,gpt-5.6-luna \
  --sources=deepseek-v3-v2,nist-ai-standards-slides-2026
```

The runner checkpoints after each PDF. Raw model outputs and downloaded PDFs stay under gitignored paths. `RESULTS.md` contains the publishable aggregate.

## What cost includes

Included: every chunk-summary call and the final reduce call.

Excluded: PDF download, local text extraction, S3 storage, cover-image generation, observability, network transfer, and developer time. The accurate wording is **“LLM inference cost to summarize extracted PDF text.”**
