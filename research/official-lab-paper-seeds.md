# Official lab paper seeds, 2025-08-04 through 2026-08-04

Snapshot: 2026-08-04  
Window: 2025-08-04 through 2026-08-04, inclusive

## Scope

This note verifies papers and technical reports that are both:

1. publicly available as a PDF (normally through arXiv), and
2. attributable to OpenAI, Anthropic, DeepSeek, MiniMax, or Moonshot AI / Kimi through a first-party publication page, official repository, or verified organization model/paper page.

For arXiv papers, `published_at` is the v1 submission timestamp, not the date of a later lab announcement or revision. This is the date the corpus code should use for the inclusion window. This is a first-party-publication inventory, not an affiliation search for every paper written by an employee.

## Current manifest: all 17 entries verified

| Lab | Title | Published at (UTC) | arXiv | Official evidence | Caveat |
|---|---|---:|---|---|---|
| OpenAI | Why Language Models Hallucinate | 2025-09-04 | [2509.04664](https://arxiv.org/abs/2509.04664) | [OpenAI](https://openai.com/index/why-language-models-hallucinate/) | OpenAI announced it on Sep 5; arXiv v1 is Sep 4. |
| OpenAI | GDPval: Evaluating AI Model Performance on Real-World Economically Valuable Tasks | 2025-10-05 | [2510.04374](https://arxiv.org/abs/2510.04374) | [OpenAI](https://openai.com/index/gdpval/) | Verified publication page and primary paper. |
| Anthropic | Poisoning Attacks on LLMs Require a Near-constant Number of Poison Samples | 2025-10-08 | [2510.07192](https://arxiv.org/abs/2510.07192) | [Anthropic](https://www.anthropic.com/research/small-samples-poison) | Anthropic's post title is editorialized; use the arXiv title in the manifest. |
| Anthropic | Constitutional Classifiers++: Efficient Production-Grade Defenses against Universal Jailbreaks | 2026-01-08 | [2601.04603](https://arxiv.org/abs/2601.04603) | [Anthropic](https://www.anthropic.com/research/next-generation-constitutional-classifiers) | Official post is Jan 9; arXiv v1 is Jan 8. |
| Anthropic | Who's in Charge? Disempowerment Patterns in Real-World LLM Usage | 2026-01-27 | [2601.19062](https://arxiv.org/abs/2601.19062) | [Anthropic](https://www.anthropic.com/research/disempowerment-patterns) | Official post is Jan 28; arXiv v1 is Jan 27. |
| Anthropic | How AI Impacts Skill Formation | 2026-01-28 | [2601.20245](https://arxiv.org/abs/2601.20245) | [Anthropic](https://www.anthropic.com/research/AI-assistance-coding-skills) | Official post uses a longer editorial title. |
| DeepSeek | DeepSeek-OCR: Contexts Optical Compression | 2025-10-21 | [2510.18234](https://arxiv.org/abs/2510.18234) | [official repository](https://github.com/deepseek-ai/DeepSeek-OCR) | Repository also contains a first-party PDF copy. |
| DeepSeek | DeepSeekMath-V2: Towards Self-Verifiable Mathematical Reasoning | 2025-11-27 | [2511.22570](https://arxiv.org/abs/2511.22570) | [official repository](https://github.com/deepseek-ai/DeepSeek-Math-V2) | Repository citation omits the arXiv ID, but title and authors match the primary paper. |
| DeepSeek | Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models | 2026-01-12 | [2601.07372](https://arxiv.org/abs/2601.07372) | [official repository](https://github.com/deepseek-ai/Engram) | Repository also contains `Engram_paper.pdf`. |
| DeepSeek | DeepSeek-OCR 2: Visual Causal Flow | 2026-01-28 | [2601.20552](https://arxiv.org/abs/2601.20552) | [official repository](https://github.com/deepseek-ai/DeepSeek-OCR-2) | Repository also contains a first-party PDF copy. |
| MiniMax | Towards Scalable Pre-training of Visual Tokenizers for Generation | 2025-12-15 | [2512.13687](https://arxiv.org/abs/2512.13687) | [official repository](https://github.com/MiniMax-AI/VTP) | README announces the report on Dec 16; arXiv v1 is Dec 15. |
| MiniMax | MiniMax Sparse Attention | 2026-06-11 | [2606.13392](https://arxiv.org/abs/2606.13392) | [official M3 repository](https://github.com/MiniMax-AI/MiniMax-M3) | The M3 repository calls this its technical report. |
| Moonshot AI / Kimi | Kimi K2.5: Visual Agentic Intelligence | 2026-02-02 | [2602.02276](https://arxiv.org/abs/2602.02276) | [official repository](https://github.com/MoonshotAI/Kimi-K2.5) | Repository was created before the arXiv paper; use the arXiv v1 date. |
| Moonshot AI / Kimi | WorldVQA: Measuring Atomic World Knowledge in Multimodal Large Language Models | 2026-01-28 | [2602.02537](https://arxiv.org/abs/2602.02537) | [official repository](https://github.com/MoonshotAI/WorldVQA) | The February-style arXiv ID has a Jan 28 v1 timestamp. |
| Moonshot AI / Kimi | Attention Residuals | 2026-03-16 | [2603.15031](https://arxiv.org/abs/2603.15031) | [official repository](https://github.com/MoonshotAI/Attention-Residuals) | Repository also contains a first-party PDF copy. |
| Moonshot AI / Kimi | Kimi K3: Open Frontier Intelligence | 2026-07-27 | [2607.24653](https://arxiv.org/abs/2607.24653) | [official repository](https://github.com/MoonshotAI/Kimi-K3) | Do not use only the unversioned repository PDF; an arXiv record exists. |
| Moonshot AI / Kimi | PerceptionBench: Evaluating Atomic Visual Perception in Multimodal Large Language Models | 2026-07-27 | [2607.24957](https://arxiv.org/abs/2607.24957) | [official repository](https://github.com/MoonshotAI/PerceptionBench) | Repository creation predates the arXiv v1 date. |

## High-confidence missing arXiv seeds

These meet the same evidence rule but are absent from `corpus/official-lab-seeds.json`.

| Lab | Title | Published at (UTC) | arXiv | Official evidence | Caveat |
|---|---|---:|---|---|---|
| OpenAI | Weight-sparse transformers have interpretable circuits | 2025-11-17 | [2511.13653](https://arxiv.org/abs/2511.13653) | [OpenAI](https://openai.com/index/understanding-neural-networks-through-sparse-circuits/) | OpenAI's Nov 13 post predates arXiv v1; use Nov 17. |
| OpenAI | Training LLMs for Honesty via Confessions | 2025-12-08 | [2512.08093](https://arxiv.org/abs/2512.08093) | [OpenAI](https://openai.com/index/how-confessions-can-keep-language-models-honest/) | OpenAI's Dec 3 post predates arXiv v1; use Dec 8. |
| OpenAI | Reasoning Models Struggle to Control their Chains of Thought | 2026-03-05 | [2603.05706](https://arxiv.org/abs/2603.05706) | [OpenAI](https://openai.com/index/reasoning-models-chain-of-thought-controllability/) | Page and arXiv v1 are the same day. |
| OpenAI | IH-Challenge: A Training Dataset to Improve Instruction Hierarchy on Frontier LLMs | 2026-03-11 | [2603.10521](https://arxiv.org/abs/2603.10521) | [OpenAI](https://openai.com/index/instruction-hierarchy-challenge/) | OpenAI's Mar 10 post predates arXiv v1 by one day. |
| OpenAI | Predicting LLM Safety Before Release by Simulating Deployment | 2026-07-08 | [2607.07184](https://arxiv.org/abs/2607.07184) | [OpenAI](https://openai.com/index/deployment-simulation/) | The official post is dated Jun 16; the public arXiv v1 appeared Jul 8. |
| Anthropic | Cross-Architecture Model Diffing with Crosscoders: Unsupervised Discovery of Differences Between LLMs | 2026-02-12 | [2602.11729](https://arxiv.org/abs/2602.11729) | [Anthropic](https://www.anthropic.com/research/diff-tool) | Anthropic's post was published Mar 13. |
| DeepSeek | DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models | 2025-12-02 | [2512.02556](https://arxiv.org/abs/2512.02556) | [verified DeepSeek paper page](https://huggingface.co/deepseek-ai/papers) | Do not confuse this with the Sep 2025 `V3.2-Exp` repository release. |
| DeepSeek | mHC: Manifold-Constrained Hyper-Connections | 2025-12-31 | [2512.24880](https://arxiv.org/abs/2512.24880) | [verified DeepSeek paper page](https://huggingface.co/deepseek-ai/papers) | No dedicated first-party GitHub repository was found. |
| DeepSeek | DualPath: Breaking the Storage Bandwidth Bottleneck in Agentic LLM Inference | 2026-02-25 | [2602.21548](https://arxiv.org/abs/2602.21548) | [verified DeepSeek paper page](https://huggingface.co/deepseek-ai/papers) | First-party organization attribution comes from the verified paper page. |
| DeepSeek | DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation | 2026-07-06 | [2607.05147](https://arxiv.org/abs/2607.05147) | [official DeepSpec repository](https://github.com/deepseek-ai/DeepSpec) | README identifies the checkpoints used in this paper. |
| MiniMax | The MiniMax-M2 Series: Mini Activations Unleashing Max Real-World Intelligence | 2026-05-26 | [2605.26494](https://arxiv.org/abs/2605.26494) | [official MiniMax organization page](https://huggingface.co/MiniMaxAI) | Covers M2 through M2.7; individual M2.x release READMEs are not separate papers. |
| MiniMax | MaxProof: Scaling Mathematical Proof with Generative-Verifier RL and Population-Level Test-Time Scaling | 2026-06-11 | [2606.13473](https://arxiv.org/abs/2606.13473) | [official MiniMax organization page](https://huggingface.co/MiniMaxAI) | Separate paper from MiniMax Sparse Attention, despite the same v1 date. |
| Moonshot AI / Kimi | Kimi Linear: An Expressive, Efficient Attention Architecture | 2025-10-30 | [2510.26692](https://arxiv.org/abs/2510.26692) | [official repository](https://github.com/MoonshotAI/Kimi-Linear) | The README's paper badge goes through Hugging Face, but resolves to this arXiv record. |

## Official PDF reports the current seed schema cannot represent

`OfficialLabSeed` requires an `arxivId`. The following first-party PDFs are valid corpus candidates under a "papers and technical reports" policy, but cannot be added without extending that type to support a stable PDF URL and a separately verified publication date.

| Lab | Report | Public date | Stable PDF | Official evidence |
|---|---|---:|---|---|
| OpenAI | How People Use ChatGPT | 2025-09-15 | [PDF](https://cdn.openai.com/pdf/a253471f-8260-40c6-a2cc-aa93fe9f142e/economic-research-chatgpt-usage-paper.pdf) | [OpenAI](https://openai.com/index/how-people-are-using-chatgpt/) |
| OpenAI | Early science acceleration experiments with GPT-5 | 2025-11-20 | [PDF](https://cdn.openai.com/pdf/4a25f921-e4e0-479a-9b38-5367b47e8fd0/early-science-acceleration-experiments-with-gpt-5.pdf) | [OpenAI](https://openai.com/index/accelerating-science-gpt-5/) |
| OpenAI | AI as a Scientific Collaborator | 2026-01 (day not stated in PDF) | [PDF](https://cdn.openai.com/pdf/f4b4a5da-b2de-418d-9fcd-6b293e9dc157/oai_ai-as-a-scientific-collaborator_jan-2026.pdf) | [first-party PDF](https://cdn.openai.com/pdf/f4b4a5da-b2de-418d-9fcd-6b293e9dc157/oai_ai-as-a-scientific-collaborator_jan-2026.pdf) |
| OpenAI | Using a GPT-5-driven autonomous lab to optimize the cost and titer of cell-free protein synthesis | 2026-02-05 | [PDF](https://cdn.openai.com/pdf/5a12a3bc-96b7-4e07-9386-db6ee5bb2ed9/using-a-gpt-5-driven-autonomous-lab-to-optimize-the-cost-and-titer-of-cell-free-protein-synthesis.pdf) | [OpenAI](https://openai.com/index/gpt-5-lowers-protein-synthesis-cost/) |
| OpenAI | AI and International Security | 2026-02-06 | [PDF](https://cdn.openai.com/pdf/international-security.pdf) | [first-party PDF](https://cdn.openai.com/pdf/international-security.pdf) |
| OpenAI | GPT as a Measurement Tool | 2026-02-13 | [PDF](https://cdn.openai.com/pdf/7517a586-5bfa-4b87-bd3d-6ea0e9e844c7/GPT-as-a-measurement-tool.pdf) | [OpenAI](https://openai.com/index/scaling-social-science-research/) |
| OpenAI | LifeSciBench | 2026-06-17 | [PDF](https://cdn.openai.com/pdf/b4299379-0a97-4ffa-8b9b-c3fbb299caa9/lifescibench_preprint.pdf) | [OpenAI](https://openai.com/index/introducing-life-sci-bench/) |
| OpenAI | Scientific computing in the age of agentic AI | 2026-07-28 | [PDF](https://cdn.openai.com/pdf/scientific-computing-in-the-age-of-agentic-ai-an-exploratory-field-report.pdf) | [OpenAI](https://openai.com/index/scientific-computing-agentic-ai/) |
| OpenAI | Ten Advances in Mathematics and Theoretical Computer Science | 2026-08-01 | [PDF](https://cdn.openai.com/pdf/ten-proofs-oai.pdf) | [OpenAI](https://openai.com/index/ten-advances-in-mathematics/) |
| Anthropic | Anthropic Economic Index: Uneven geographic and enterprise AI adoption | 2025-09-15 | [PDF](https://assets.anthropic.com/m/218c82b858610fac/original/Economic-Index.pdf) | [Anthropic](https://www.anthropic.com/research/anthropic-economic-index-september-2025-report) |
| Anthropic | Anthropic Economic Index: Economic primitives | 2026-01-15 | [PDF](https://www-cdn.anthropic.com/096d94c1a91c6480806d8f24b2344c7e2a4bc666.pdf) | [Anthropic](https://www.anthropic.com/research/anthropic-economic-index-january-2026-report) |
| Anthropic | Agentic coding and persistent returns to expertise | 2026-06-16 | [PDF](https://cdn.sanity.io/files/4zrzovbb/website/433472e34b60db1a52ebf0b8c6600f057b6908c5.pdf) | [Anthropic](https://www.anthropic.com/research/claude-code-expertise) |

## Exclusions and warnings

- Exclude launch posts and model cards that have no public paper/PDF. Examples include the individual MiniMax M2, M2.1, M2.5, and M2.7 release repositories; they are covered by the later M2-series paper, not four separate papers.
- Exclude Kimi K2 (`2507.20534`) from this exact window: arXiv v1 was 2025-07-28. A later model-card update does not move the paper into the window.
- Exclude MiniMax-M1 (`2506.13585`), Kimi-VL (`2504.07491`), and Kimi-Audio (`2504.18425`) for the same reason.
- Anthropic's Transformer Circuits articles can be substantial research publications, but several are HTML-only. Do not place them in a PDF benchmark unless a public PDF is independently verified.
- Do not treat a model name appearing in a title or abstract as proof of lab authorship. Keep `officialEvidenceUrl` tied to the lab's own page, repository, or verified organization page.
- The current 17-seed manifest is internally valid but incomplete under its own arXiv-only policy: the 13 high-confidence rows above should be added before freezing the corpus.
