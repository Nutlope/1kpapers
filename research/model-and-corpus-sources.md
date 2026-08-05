# Model and corpus sources

Retrieved **2026-08-04**. Prices are USD per 1 million tokens unless noted. This note uses only provider documentation/APIs and first-party document hosts.

## Recommended comparison set

Use the same extracted text, chunk boundaries, prompts, output limits, and non-reasoning settings for every model. Record API-reported input, cached-input, reasoning, and output tokens separately, then calculate cost from the rate card captured with the run.

| Provider | Model ID | Input | Cached input | Output | Why include it |
| --- | --- | ---: | ---: | ---: | --- |
| Together | `deepseek-ai/DeepSeek-V4-Flash-0731` | $0.14 | $0.03 | $0.28 | Subject of the cost claim and the SmartPDFs candidate. |
| Together | `Qwen/Qwen3.5-9B` | $0.17 | Not listed | $0.25 | Low-cost small-model comparison with structured-output support. |
| Together | `MiniMaxAI/MiniMax-M3` | $0.30 | $0.06 | $1.20 | Low-cost current MiniMax comparison with structured-output support. |
| Anthropic | `claude-haiku-4-5-20251001` | $1.00 | $0.10 | $5.00 | Anthropic describes Haiku 4.5 as its fastest current model with near-frontier intelligence. Use the pinned ID, not the alias. |
| OpenAI | `gpt-5.6-luna` | $0.20 | $0.02 | $1.20 | OpenAI's current cost-sensitive, high-volume GPT-5.6 model and the requested OpenAI comparison. |

Sources:

- [Together serverless model catalog](https://docs.together.ai/docs/serverless/models) lists the exact model IDs, token prices, caching prices where available, and structured-output support. The authenticated [`GET /v1/models`](https://api.together.xyz/v1/models) response was also checked on the retrieval date and agreed on the three Together price entries above.
- [Anthropic models overview](https://platform.claude.com/docs/en/about-claude/models/overview) gives the pinned Haiku ID, calls it the fastest current Claude model, and lists $1 input / $5 output. [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing) gives its $0.10 cache-hit rate and confirms that `MTok` means one million tokens.
- [OpenAI GPT-5.6 Luna model page](https://developers.openai.com/api/docs/models/gpt-5.6-luna) lists $0.20 input, $0.02 cached input, and $1.20 output, a 1.05M context window, structured outputs, and a long-context surcharge above 272K input tokens. Keep each request below 272K input tokens so the standard rate applies. For reference, [GPT-5.4 nano](https://developers.openai.com/api/docs/models/gpt-5.4-nano) is also $0.20 input but $1.25 output; Luna is the better requested current-family cost comparator.

Kimi K3 and GLM 5.2 are intentionally reserved for blind judging. Using either as both a summarizer and a judge would weaken candidate independence unless every self-judged row were routed exclusively to the other judge.

### OpenAI subscription boundary

A ChatGPT or Codex subscription does **not** pay for arbitrary OpenAI API calls. OpenAI says the API is billed and managed separately from ChatGPT, with API billing configured on the Platform account: [subscription-to-API billing answer](https://help.openai.com/en/articles/8156019-how-can-i-move-my-chatgpt-subscription-to-the-api), [billing settings](https://help.openai.com/en/articles/9039756-billing-settings-in-chatgpt-vs-platform). The benchmark therefore needs a separately billed `OPENAI_API_KEY`; it must not try to reuse ChatGPT/Codex subscription credentials.

## PDF corpus

The repository should commit only this metadata (plus hashes/results), never the PDFs. Download into a gitignored cache, calculate SHA-256, and record the final resolved URL, byte length, hash, extraction library/version, page count, and extracted character/token count in each run.

| ID / type | Document | Landing page | Version-pinned direct PDF | Availability / rights note |
| --- | --- | --- | --- | --- |
| `deepseek-v3-v2` / AI paper | DeepSeek-V3 Technical Report | [arXiv 2412.19437](https://arxiv.org/abs/2412.19437) | [PDF v2](https://arxiv.org/pdf/2412.19437v2) | Publicly downloadable from arXiv. The item uses arXiv's [non-exclusive distribution license](https://arxiv.org/licenses/nonexclusive-distrib/1.0/); do not republish the file. |
| `deepseek-r1-v2` / AI paper | DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning | [arXiv 2501.12948](https://arxiv.org/abs/2501.12948) | [PDF v2](https://arxiv.org/pdf/2501.12948v2) | Publicly downloadable from arXiv under the same non-exclusive distribution license; do not republish the file. |
| `attention-v7` / foundational AI paper | Attention Is All You Need | [arXiv 1706.03762](https://arxiv.org/abs/1706.03762) | [PDF v7](https://arxiv.org/pdf/1706.03762v7) | Publicly downloadable from arXiv under the same non-exclusive distribution license; do not republish the file. |
| `alice-1890` / public-domain book | Alice's Adventures in Wonderland, 1890 scan | [Wikimedia Commons file record](https://commons.wikimedia.org/wiki/File:Alice%27s_adventures_in_wonderland_%28IA_alicesadventurescarroll%29.pdf) | [Internet Archive PDF](https://archive.org/download/alicesadventurescarroll/alicesadventurescarroll.pdf) | Commons identifies this 216-page edition as public domain in the US and gives the Internet Archive source. Useful long-book/extraction case. |
| `nist-ai-standards-slides-2026` / presentation | The International AI Standards Landscape: ITL's Role, Priorities, and Progress | [NIST webinar page](https://www.nist.gov/news-events/events/2026/03/nist-information-technology-laboratory-ai-webinar-series-international-ai) | [49-slide PDF](https://www.nist.gov/document/2026-03-06-itl-ai-webinar-series-slides-ai-standards-landscape) | NIST publishes the deck as the official webinar slides. NIST says its site information may be distributed/copied unless marked copyrighted: [copyrights and disclaimers](https://www.nist.gov/copyrights-disclaimers). |
| `stanford-ai-index-2026` / long report | The 2026 AI Index Report | [Stanford HAI report page](https://hai.stanford.edu/ai-index/2026-ai-index-report) | [Full report PDF](https://hai.stanford.edu/assets/files/ai_index_report_2026.pdf) | Stanford's official page offers the full report for public download. Treat it as copyrighted: cache only, do not redistribute. It is a valuable large-report stress case (~37.9 MB). |

All six direct URLs returned HTTP 200 with `application/pdf` on 2026-08-04. Versioned arXiv URLs prevent future paper revisions from silently changing the corpus. The non-versioned institutional files can still change in place, so the first successful download's SHA-256 must become the benchmark fixture; fail loudly on later hash drift until the corpus is deliberately refreshed.

## Benchmark interpretation

- The headline should mean **LLM inference cost to summarize extracted PDF text**, not total product cost. Exclude download, local PDF parsing, S3, cover-image generation, observability, and developer time unless shown separately.
- Use standard synchronous pricing for the main comparison. Batch discounts and prompt-cache hits should be separate experiments, not mixed into the headline.
- Disable optional reasoning for every model and report any unavoidable reasoning tokens. Keep temperature, maximum output, prompt, and reduction strategy identical.
- Report per-document and aggregate cost, latency, failures/retries, tokens, and a deterministic factual-coverage score. Cheap output is not useful if the summary omits central facts.
- Do not call these models equivalent in quality before the benchmark. The defensible result is a measured cost/latency/coverage comparison on this fixed corpus.

## Known uncertainties

- Together's public catalog currently lists GLM-5.2 with a 262,144-token context window while the authenticated models endpoint returned 512,000. This does not affect a 50K-character chunking pipeline, but the runner should query/log the live model metadata and avoid relying on the larger value.
- Provider prices and aliases can change. Store a timestamped price snapshot with every result and cite the retrieval date in any tweet.
- arXiv's license grants arXiv distribution rights; it is not a blanket open-source license for arbitrary republication. The benchmark avoids this issue by downloading at runtime and committing only URLs, hashes, and derived measurements/summaries.
