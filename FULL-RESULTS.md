# Summarizing 1,000 AI papers

Generated: 2026-08-06T03:54:54.011Z

This is a corpus-scale cost and operational-statistics report. Judges were intentionally removed, so these results do not rank factual accuracy or summary quality.

## Model totals

Cost counts exactly one completed result per model and paper. Failed and superseded runs are excluded for every model.

| Model | Completed | Completed-summary inference cost | Cost / completed paper | Relative cost | Input tokens | Output tokens | p50 latency | p95 latency | Latency samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| DeepSeek V4 Flash | 1000/1000 | $3.994620 | $0.003995 | 1.00x | 27,956,295 | 288,353 | 231.4s | 415.3s | 300 |
| GPT-5.6 Luna | 1000/1000 | $6.003684 | $0.006004 | 1.50x | 28,149,370 | 311,508 | 62.3s | 110.2s | 1,000 |
| Claude Haiku 4.5 | 1000/1000 | $35.755200 | $0.035755 | 8.95x | 33,192,455 | 512,549 | 63.9s | 129.5s | 1,000 |

Per-paper latency is measured only for synchronous requests inside concurrent runs; batch rows have no fabricated latency and are excluded from these percentiles. This is not the time a sequential 1,000-paper job would take.

## Corpus summarized

- 1,000 public papers
- 30,681 PDF pages
- 102,740,868 extracted characters
- Paper length: median 25 pages, p95 66 pages, maximum 488 pages
- Extracted text: median 83,485 characters, p95 213,471, maximum 1,018,185

### Guaranteed official-lab papers

| Lab | Papers |
| --- | ---: |
| DeepSeek | 8 |
| OpenAI | 7 |
| Moonshot AI / Kimi | 6 |
| Anthropic | 5 |
| MiniMax | 4 |

### Non-exclusive topics

| Topic | Papers |
| --- | ---: |
| llms-agents-reasoning | 766 |
| vision-multimodal-generation | 521 |
| systems-efficiency | 378 |
| robotics-embodied-ai | 104 |
| science-medicine | 92 |

## Summary output

| Model | p50 summary words | p95 summary words | Deterministically trimmed finals |
| --- | ---: | ---: | ---: |
| DeepSeek V4 Flash | 155 | 250 | 54 |
| GPT-5.6 Luna | 174 | 216 | 1 |
| Claude Haiku 4.5 | 203 | 245 | 29 |

## Most expensive completed summaries

| Model | Paper | Pages | Cost | Latency |
| --- | --- | ---: | ---: | ---: |
| Claude Haiku 4.5 | The Principles of Diffusion Models | 488 | $0.465661 | 536.2s |
| Claude Haiku 4.5 | From Code Foundation Models to Agents and Applications: A Comprehensive Survey and Practical Guide to Code Intelligence | 303 | $0.422543 | 661.6s |
| Claude Haiku 4.5 | A Survey of Scientific Large Language Models: From Data Foundations to Agent Frontiers | 95 | $0.313517 | 599.6s |
| Claude Haiku 4.5 | Project Imaging-X: A Survey of 1000+ Open-Access Medical Imaging Datasets for Foundation Model Development | 157 | $0.287811 | 114.0s |
| Claude Haiku 4.5 | From Chatbot to Digital Colleague: The Paradigm Shift Toward Persistent Autonomous AI | 150 | $0.218535 | 340.1s |
| Claude Haiku 4.5 | Cosmos 3: Omnimodal World Models for Physical AI | 139 | $0.215660 | 495.3s |
| Claude Haiku 4.5 | Visual Generation in the New Era: An Evolution from Atomic Mapping to Agentic World Modeling | 129 | $0.206516 | 386.4s |
| Claude Haiku 4.5 | EVA-Bench: A New End-to-end Framework for Evaluating Voice Agents | 157 | $0.188155 | 335.3s |
| Claude Haiku 4.5 | Memory in the Age of AI Agents | 107 | $0.183131 | 383.4s |
| Claude Haiku 4.5 | Agentic Reasoning for Large Language Models | 135 | $0.182594 | 359.5s |
| Claude Haiku 4.5 | A Survey of Reinforcement Learning for Large Reasoning Models | 120 | $0.180458 | 309.5s |
| Claude Haiku 4.5 | Probing Scientific General Intelligence of LLMs with Scientist-Aligned Workflows | 156 | $0.177139 | 339.6s |
| Claude Haiku 4.5 | Agentic Environment Engineering for Large Language Models: A Survey of Environment Modeling, Synthesis, Evaluation, and Application | 63 | $0.176061 | 359.6s |
| Claude Haiku 4.5 | The Landscape of Agentic Reinforcement Learning for LLMs: A Survey | 95 | $0.131288 | 104.8s |
| Claude Haiku 4.5 | SpatialBench: Is Your Spatial Foundation Model an All-Round Player? | 81 | $0.124682 | 107.9s |

## Unresolved failures

| Model | Paper | Error |
| --- | --- | --- |
| None | n/a | n/a |

## Method

- The complete locally extracted PDF text is sent in one request when it fits a conservative half-context character budget.
- Oversized inputs use the same 50,000-character map/reduce fallback instead of truncating source text.
- 1 provider-filtered paper used an explicit main-body-only fallback ending before the References section; its appendices and references were excluded.
- Models receive the same final-summary prompt and restricted Markdown contract; extended reasoning is disabled.
- Costs count one completed result per model and paper. Failed and superseded runs are excluded.
- Costs use provider-reported token usage and the frozen standard synchronous prices in the repository.
- PDF download, local extraction, storage, networking, judge inference, and developer time are excluded.
- This report supports cost, scale, and operational comparisons only; it does not establish factual accuracy.

