# A year in AI papers

What does it cost to summarize the research that defined a year of AI, and how do current models compare on cost and speed?

This open benchmark freezes 1,000 public AI papers from August 4, 2025 through August 4, 2026, summarizes them with current language models, and measures inference cost, throughput, reliability, and corpus-wide trends. It was inspired by [Nutlope/SmartPDFs](https://github.com/Nutlope/smartpdfs), but it is a standalone benchmark rather than a production-app replica.

## Frozen 1,000-paper corpus

The August 4, 2026 snapshot contains:

- **8,262** unique discovery candidates from Hugging Face Daily Papers.
- **1,000** selected papers with unique arXiv IDs.
- **1,000/1,000** version-pinned PDF URLs returning HTTP 200 and `application/pdf`.
- **1,000/1,000** PDFs downloaded and text-extracted: 30,681 pages and 102,740,868 characters.
- **30 mandatory official-lab papers** backed by first-party evidence.
- **1 inaccessible PDF and 1 out-of-window paper detected and replaced** before any model calls.

Official research coverage is guaranteed rather than inferred from model-name mentions:

| Lab | Verified official papers |
| --- | ---: |
| OpenAI | 7 |
| Anthropic | 5 |
| DeepSeek | 8 |
| MiniMax | 4 |
| Moonshot AI / Kimi | 6 |

The rest of the corpus is filled by current Hugging Face Daily Papers upvotes. This makes the public description precise: **1,000 popular papers that defined a year of AI, with guaranteed official research from five frontier labs.** It is not every AI paper and it is not a citation-based claim of scientific importance.

The non-exclusive topic tags show that the corpus is broader than LLM release reports:

| Topic | Papers |
| --- | ---: |
| LLMs, agents, and reasoning | 766 |
| Vision, multimodal work, and generation | 521 |
| AI systems and efficiency | 378 |
| Robotics and embodied AI | 104 |
| AI for science and medicine | 92 |

[`corpus/papers.json`](./corpus/papers.json) is the frozen manifest. It records the selection reason, version-pinned URLs, authors, abstract, categories, upvotes and snapshot time, official-lab evidence, topic/model-family tags, HTTP status, content type, byte size, and arXiv-provided SHA-256 where available. PDFs are never committed.

[`corpus/full-1000-profile.json`](./corpus/full-1000-profile.json) records the successful extraction profile for every paper, including the downloaded SHA-256, byte size, page count, and extracted character count. The median paper is 25 pages and 83,501 characters; the largest extraction is 1,018,185 characters. PDFs remain local and gitignored.

## Rebuild the corpus

Requirements: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm corpus
```

The discovery script:

1. fetches candidates from Hugging Face Daily Papers and enforces the fixed window using each paper's arXiv v1 publication date;
2. injects the verified official-lab seeds in [`corpus/official-lab-seeds.json`](./corpus/official-lab-seeds.json);
3. fills a 1,050-paper candidate set by current upvotes;
4. enriches it through arXiv's metadata API;
5. verifies every version-pinned PDF using HEAD requests; and
6. freezes the first 1,000 valid papers, failing if a mandatory lab paper is unavailable.

Thank you to arXiv for use of its open access interoperability.

## Benchmark plan

No 1,000-paper model run has been published yet. The execution sequence is:

1. Compare every candidate model on a diverse 50-paper cost, latency, and completion pilot.
2. Use the matched successful-paper subset for a like-for-like cost comparison.
3. Run all 1,000 papers with DeepSeek V4 Flash, GPT-5.6 Luna, and Claude Haiku 4.5 using independent, recoverable checkpoints.
4. Publish per-model inference cost, elapsed time, tokens, completion coverage, and corpus-wide page, length, lab, and topic statistics.

The full run is a corpus-scale cost and statistics experiment, not a factuality benchmark. A blind-judge experiment was started, then intentionally stopped because judge inference cost exceeded summarization cost without improving the requested general-statistics story.

### Frozen summarizer matrix

The pilot uses standard synchronous, uncached pricing retrieved on August 5, 2026:

| Model | Provider | Input / output per 1M tokens |
| --- | --- | ---: |
| DeepSeek V4 Flash | Together AI | $0.14 / $0.28 |
| Qwen3.5 9B | Together AI | $0.17 / $0.25 |
| MiniMax M3 | Together AI | $0.30 / $1.20 |
| GPT-5.6 Luna | OpenAI | $0.20 / $1.20 |
| Claude Haiku 4.5 | Anthropic | $1.00 / $5.00 |

The dated source snapshot is committed at [`research/model-pricing-snapshot-2026-08-05.json`](./research/model-pricing-snapshot-2026-08-05.json). Together requests disable reasoning and use strict JSON Schema. Claude Haiku uses the standard synchronous Messages API with Anthropic's GA `output_config.format` JSON Schema, not Batch.

### Run it

```bash
pnpm download -- --source-file=corpus/pilot-50.json --profile=corpus/pilot-50-profile.json
pnpm benchmark -- --source-file=corpus/pilot-50.json --run-id=pilot
pnpm report -- --input=results/runs/pilot/result.json --output=PILOT.md --details=true

BENCHMARK_TIMEOUT_MS=600000 BENCHMARK_DOCUMENT_TIMEOUT_MS=900000 pnpm benchmark -- \
  --source-file=corpus/sources-1000.json \
  --models=deepseek-ai/DeepSeek-V4-Flash-0731 \
  --concurrency=4 \
  --document-concurrency=8 \
  --single-pass=true \
  --run-id=full-1000-deepseek-single-pass-v11
```

The five-model pilot and three-model full run require `TOGETHER_API_KEY`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY`. Run each provider independently to use their separate capacity pools. Checkpoints are local and gitignored; rerunning the same command resumes completed model/paper rows. The default reliability policy allows two attempts per request and enforces a 90-second request timeout. The offline commands raise individual requests to ten minutes and the complete-document deadline to 15 minutes. Concurrency and timeout settings are fingerprinted in run metadata. This repository is a standalone benchmark, so final summaries use restricted Markdown rather than SmartPDFs' production HTML. Headings and alternate bullet markers are normalized; raw HTML and code fences are rejected. Output beyond 250 words or 3,000 characters is deterministically shortened at word boundaries and counted in the report.

The full run uses one-pass summarization: the complete extracted PDF text is sent in one request whenever it fits a conservative half-context character budget. This avoids an unnecessary chunk-summary plus reduce fan-out for long-context models. Oversized documents automatically retain the 50,000-character map/reduce fallback, so no source text is silently truncated. Extracted text is cached locally by PDF hash and reused across model runs.

## Existing cost baseline

The earlier six-document SmartPDFs benchmark remains a useful pipeline baseline, but it is not the 1,000-paper result. Across the four PDFs that all compared models completed—333 pages spanning a paper, presentation, and public-domain book:

| Model | Total inference cost | Relative to Flash |
| --- | ---: | ---: |
| DeepSeek V4 Flash | **$0.021711** | 1× |
| GPT-5.6 Luna | $0.036546 | 1.68× |
| Claude Haiku 4.5 | $0.221633 | 10.21× |
| GLM 5.2 | $0.237984 | 10.96× |

See [RESULTS.md](./RESULTS.md) for the original per-PDF results, failures, partial costs, fact checks, and latencies. The eventual article headline will use the measured full-corpus cost—not a preselected `$2` claim.

## What cost includes

Included: every successful full-text summary call, or every chunk-summary and final-reduce call for documents that require the oversized-input fallback.

Excluded: PDF download, local text extraction, storage, observability, network transfer, judge inference, and developer time. The accurate wording is **“LLM inference cost to summarize extracted PDF text.”**

If a timed-out provider request returns no usage metadata, the benchmark records its billing as unknown and does not invent a zero-token charge. Reported totals therefore remain provider-usage-accounted costs, with unknown timeout billing disclosed alongside completion failures.
