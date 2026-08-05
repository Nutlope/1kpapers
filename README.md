# A year in AI papers

What does it cost to summarize the research that defined a year of AI—and which model does it most accurately?

This open benchmark freezes 1,000 public AI papers from August 4, 2025 through August 4, 2026, summarizes them with current language models, and measures inference cost, factual coverage, reliability, and latency. It was inspired by [Nutlope/SmartPDFs](https://github.com/Nutlope/smartpdfs), but it is a standalone benchmark rather than a production-app replica.

## Frozen 1,000-paper corpus

The August 4, 2026 snapshot contains:

- **8,262** unique discovery candidates from Hugging Face Daily Papers.
- **1,000** selected papers with unique arXiv IDs.
- **1,000/1,000** version-pinned PDF URLs returning HTTP 200 and `application/pdf`.
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

No 1,000-paper model run has been published yet. The sequence is deliberately gated:

1. Compare every candidate model on a diverse 50-paper pilot.
2. Calibrate blind factuality judges against a human-checked subset.
3. Select finalists using quality, completion rate, latency, and cost.
4. Run the full corpus only with the finalists.

Quality and operational reliability are reported separately. A model does not receive a good quality score for malformed or missing output, and a fast response does not imply a faithful summary. Judge inference cost is reported separately from summary inference cost.

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

### Blind quality judging

Kimi K3 is the primary blind judge at high reasoning effort. GLM 5.2 independently scores the entire pilot to measure agreement; disagreements of 20 points or more require human review. Candidate identities, providers, prices, latency, and the held-out human calibration checklists are hidden from both judges. The full run uses a disclosed stratified GLM audit instead of needlessly paying to double-score every row.

Judge inputs use a conservative three-characters-per-token context estimate. A paper that would leave insufficient response space is recorded as a context skip rather than truncated; Kimi and human review cover any row that exceeds GLM's lower public context limit.

Judge inference is intentionally excluded from summarization cost. See [`research/judge-model-selection-2026-08-05.md`](./research/judge-model-selection-2026-08-05.md) for the measured high-versus-max Kimi preflight and projected judge spend.

### Human calibration gate

Before inspecting any candidate summaries or judge scores, a human reviewer reads each of the 15 linked papers in [`corpus/calibration-15.json`](./corpus/calibration-15.json), records the central question, main contribution, strongest results, limitations, and qualification risks, then changes `reviewStatus` to `human-reviewed`. `pnpm calibration:check` must report 15/15 before the benchmark is described as human-calibrated. Machine-generated checklists do not satisfy this gate; Kimi K3 and GLM 5.2 never receive these held-out answers in their prompts.

### Run it

```bash
pnpm download -- --source-file=corpus/pilot-50.json --profile=corpus/pilot-50-profile.json
pnpm benchmark -- --source-file=corpus/pilot-50.json --run-id=pilot
pnpm report -- --input=results/runs/pilot/result.json --output=PILOT.md --details=true
pnpm judge -- --input=results/runs/pilot/result.json --run-id=pilot-judges
pnpm calibration:check
pnpm quality -- --input=results/runs/pilot/result.json --judgments=results/judges/pilot-judges/result.json --calibration=corpus/calibration-15.json
```

The benchmark requires `TOGETHER_API_KEY`, `OPENAI_API_KEY`, and `ANTHROPIC_API_KEY`. Checkpoints are local and gitignored; rerunning the same command resumes completed model/paper rows. The default reliability policy allows two attempts per request, enforces a 90-second request timeout, and aborts the complete paper after 180 seconds. This repository is a standalone benchmark, so final summaries use restricted Markdown rather than SmartPDFs' production HTML. Headings and alternate bullet markers are normalized; raw HTML and code fences are rejected. Output beyond 250 words or 3,000 characters is deterministically shortened at word boundaries and counted in the report. These values and contracts are fingerprinted into the run metadata.

Text is split only when it exceeds 50,000 characters. Short papers therefore need one chunk-summary call plus the final reduce call rather than an artificial four-way fan-out; every model still receives identical extracted text and chunk boundaries.

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

Included: every chunk-summary call and the final reduce call.

Excluded: PDF download, local text extraction, storage, observability, network transfer, judge inference, and developer time. The accurate wording is **“LLM inference cost to summarize extracted PDF text.”**
