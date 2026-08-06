# SmartPDFs summarization benchmark

Generated: 2026-08-04T13:48:16.203Z

Costs are language-model inference only. PDFs are downloaded and text is extracted locally; storage, networking, and observability are excluded.

## Results by PDF

| PDF | Pages | DeepSeek V4 Flash cost / time / facts | Kimi K3 cost / time / facts | GLM 5.2 cost / time / facts | Claude Haiku 4.5 cost / time / facts | GPT-5.6 Luna cost / time / facts |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [The International AI Standards Landscape: ITL's Role, Priorities, and Progress](https://www.nist.gov/news-events/events/2026/03/nist-information-technology-laboratory-ai-webinar-series-international-ai) | 49 | $0.001526 / 14.6s / 40% | failed / 120.0s / n/a | $0.018854 / 32.5s / 100% | $0.019218 / 10.2s / 100% | $0.003659 / 9.0s / 60% |
| [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) | 53 | $0.007984 / 24.3s / 100% | n/a | $0.088823 / 17.5s / 100% | $0.077210 / 20.2s / 100% | $0.013239 / 10.6s / 80% |
| [DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning](https://arxiv.org/abs/2501.12948) | 86 | failed / 32.7s / n/a | n/a | $0.108754 / 32.5s / 60% | $0.095962 / 37.4s / 60% | failed / 6.6s / n/a |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | 15 | $0.002455 / 13.6s / 100% | n/a | $0.029438 / 20.9s / 80% | $0.028984 / 19.2s / 100% | $0.004850 / 13.9s / 80% |
| [Alice's Adventures in Wonderland (1890 scan)](https://commons.wikimedia.org/wiki/File:Alice%27s_adventures_in_wonderland_%28IA_alicesadventurescarroll%29.pdf) | 216 | $0.009747 / 17.0s / 80% | n/a | $0.100869 / 16.4s / 60% | $0.096221 / 15.8s / 60% | $0.014798 / 8.3s / 60% |
| [The 2026 AI Index Report](https://hai.stanford.edu/ai-index/2026-ai-index-report) | 425 | failed / 60.0s / n/a | n/a | failed / 60.0s / n/a | failed / 21.2s / n/a | $0.066462 / 23.2s / 80% |

## Model totals

| Model | Completed | Input tokens | Output tokens | Successful-run cost | Median PDF cost | Median time | Median facts | Under 30s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| DeepSeek V4 Flash | 4/6 | 136,619 | 9,231 | $0.021711 | $0.005219 | 15.8s | 90% | 4/4 |
| Kimi K3 | 0/1 | 0 | 0 | $0.000000 | $0.000000 | 0.0s | 0% | 0/0 |
| GLM 5.2 | 5/6 | 206,005 | 13,257 | $0.346738 | $0.088823 | 20.9s | 80% | 3/5 |
| Claude Haiku 4.5 | 5/6 | 243,990 | 14,721 | $0.317595 | $0.077210 | 19.2s | 100% | 4/5 |
| GPT-5.6 Luna | 5/6 | 404,876 | 18,361 | $0.103008 | $0.013239 | 10.6s | 80% | 5/5 |

## Failures

| Model | PDF | Elapsed | Measured partial cost | Error |
| --- | --- | ---: | ---: | --- |
| Kimi K3 | The International AI Standards Landscape: ITL's Role, Priorities, and Progress | 120.0s | $0.000000 | The operation was aborted due to timeout |
| DeepSeek V4 Flash | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | 32.7s | $0.009909 | Unterminated string in JSON at position 4042 (line 18 column 46) |
| DeepSeek V4 Flash | The 2026 AI Index Report | 60.0s | $0.024650 | 7/18 chunk requests failed: The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout |
| GLM 5.2 | The 2026 AI Index Report | 60.0s | $0.138651 | 12/18 chunk requests failed: The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout; The operation was aborted due to timeout |
| Claude Haiku 4.5 | The 2026 AI Index Report | 21.2s | $0.310832 | 3/18 chunk requests failed: Model response did not match the summary schema; Model response did not match the summary schema; Unterminated string in JSON at position 6627 (line 3 column 6548) |
| GPT-5.6 Luna | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | 6.6s | $0.012992 | 1/5 chunk requests failed: gpt-5.6-luna failed (400): Invalid prompt: your prompt was flagged as potentially violating our usage policy. Please try again with a different prompt: https://platform.openai.com/docs/guides/reasoning#advice-on-prompting |

## Method

- Uses the same PDF.js extraction, four-or-more chunks (50,000-character maximum), prompt, chunk fan-out, and final reduce pass as Nutlope/SmartPDFs PR #8. Chunk calls allow 1,600 output tokens; the stricter final reduce allows 1,000.
- Extended reasoning is disabled. Each model sees the same extracted text and English prompt.
- Token counts come from each provider response. Prices are the configured standard API prices per one million tokens; cached-input discounts are not assumed.
- The main matrix used a 60-second per-call harness timeout; the Kimi representative run used 120 seconds. `Under 30s` is end-to-end wall time, while SmartPDFs enforces its 30-second limit on each individual route call.
- PDFs and full model outputs are gitignored. This report, source URLs, hashes, document sizes, aggregate usage, cost, and latency are publishable.
