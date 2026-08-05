# 50-paper summarization pilot

Generated: 2026-08-05T10:11:12.073Z

Run: `merged-2026-08-05T10-11-12.073Z`; methodology version: 11.

Costs are standard synchronous language-model inference only. PDFs are downloaded and text is extracted locally; judge inference, storage, networking, and observability are excluded.
A timed-out request that returns no provider usage is recorded as a failure with unknown billing and contributes no unverifiable token cost to the table.

## Matched completed-paper cost

This like-for-like view includes only the 39 papers completed by every model. A model's incomplete papers are excluded from every model in this table; completion remains reported separately below.

| Model | Papers | Cost | Cost / paper | Relative cost |
| --- | ---: | ---: | ---: | ---: |
| DeepSeek V4 Flash | 39 | $0.141455 | $0.003627 | 1.00x |
| Qwen3.5 9B | 39 | $0.184586 | $0.004733 | 1.30x |
| GPT-5.6 Luna | 39 | $0.251431 | $0.006447 | 1.78x |
| MiniMax M3 | 39 | $0.360927 | $0.009255 | 2.55x |
| Claude Haiku 4.5 | 39 | $1.472689 | $0.037761 | 10.41x |

## Model totals

| Model | Completed | Cost | Cost / attempted paper | Cost / completed paper | Input tokens | Output tokens | p50 latency | p95 latency | Retries | Trimmed finals | Failures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| DeepSeek V4 Flash | 39/50 (78.0%) | $0.197136 | $0.003943 | $0.005055 | 1,289,014 | 59,549 | 92.3s | 164.3s | 41 | 13 | 11 |
| Qwen3.5 9B | 50/50 (100.0%) | $0.284589 | $0.005692 | $0.005692 | 1,556,947 | 79,631 | 19.2s | 42.8s | 1 | 47 | 0 |
| MiniMax M3 | 50/50 (100.0%) | $0.553279 | $0.011066 | $0.011066 | 1,460,484 | 95,945 | 24.8s | 56.9s | 3 | 17 | 0 |
| Claude Haiku 4.5 | 50/50 (100.0%) | $2.262899 | $0.045258 | $0.045258 | 1,738,409 | 104,898 | 27.1s | 68.5s | 0 | 1 | 0 |
| GPT-5.6 Luna | 50/50 (100.0%) | $0.388296 | $0.007766 | $0.007766 | 1,468,248 | 78,872 | 13.1s | 25.3s | 0 | 1 | 0 |

## Failure categories

| Category | Count |
| --- | ---: |
| timeout | 10 |
| other | 1 |

## Per-paper results

| Model | Paper | Status | Cost | Latency | Requests | Retries | Error |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| DeepSeek V4 Flash | [Sharing is Caring: Efficient LM Post-Training with Collective RL Experience Sharing](https://arxiv.org/abs/2509.08721v1) | ok | $0.001920 | 56.3s | 2 | 0 | — |
| DeepSeek V4 Flash | [GrandCode: Achieving Grandmaster Level in Competitive Programming via Agentic Reinforcement Learning](https://arxiv.org/abs/2604.02721v2) | ok | $0.003265 | 98.5s | 3 | 0 | — |
| DeepSeek V4 Flash | [ABot-Earth 0.5: Generative 3D Earth Model](https://arxiv.org/abs/2606.09967v1) | ok | $0.002222 | 92.3s | 3 | 0 | — |
| DeepSeek V4 Flash | [Kimi K3: Open Frontier Intelligence](https://arxiv.org/abs/2607.24653v1) | ok | $0.008020 | 178.0s | 5 | 2 | — |
| DeepSeek V4 Flash | [Gamma-World: Generative Multi-Agent World Modeling Beyond Two Players](https://arxiv.org/abs/2605.28816v1) | ok | $0.002683 | 125.4s | 3 | 0 | — |
| DeepSeek V4 Flash | [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain](https://arxiv.org/abs/2509.26507v1) | failed | $0.005673 | 180.0s | 3 | 3 | 3/6 chunk requests failed: Document exceeded 180000ms deadline; Document exceeded 180000ms deadline; Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [Orca: The World is in Your Mind](https://arxiv.org/abs/2606.30534v3) | ok | $0.005608 | 164.3s | 4 | 1 | — |
| DeepSeek V4 Flash | [AI Can Learn Scientific Taste](https://arxiv.org/abs/2603.14473v2) | failed | $0.006235 | 181.0s | 4 | 3 | Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [Demystifying Video Reasoning](https://arxiv.org/abs/2603.16870v3) | ok | $0.002977 | 54.0s | 3 | 0 | — |
| DeepSeek V4 Flash | [MolmoAct2: Action Reasoning Models for Real-world Deployment](https://arxiv.org/abs/2605.02881v2) | ok | $0.008044 | 51.5s | 5 | 4 | — |
| DeepSeek V4 Flash | [A.S.E: A Repository-Level Benchmark for Evaluating Security in AI-Generated Code](https://arxiv.org/abs/2508.18106v3) | ok | $0.003287 | 88.2s | 3 | 0 | — |
| DeepSeek V4 Flash | [CARLA-Air: Fly Drones Inside a CARLA World -- A Unified Infrastructure for Air-Ground Embodied Intelligence](https://arxiv.org/abs/2603.28032v2) | ok | $0.002605 | 75.5s | 3 | 0 | — |
| DeepSeek V4 Flash | [mHC: Manifold-Constrained Hyper-Connections](https://arxiv.org/abs/2512.24880v2) | ok | $0.003028 | 111.7s | 3 | 0 | — |
| DeepSeek V4 Flash | [Green-VLA: Staged Vision-Language-Action Model for Generalist Robots](https://arxiv.org/abs/2602.00919v2) | ok | $0.003725 | 66.9s | 3 | 0 | — |
| DeepSeek V4 Flash | [AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis](https://arxiv.org/abs/2607.28618v1) | ok | $0.001581 | 50.3s | 2 | 0 | — |
| DeepSeek V4 Flash | [Recursive Multi-Agent Systems](https://arxiv.org/abs/2604.25917v2) | ok | $0.004401 | 75.4s | 4 | 0 | — |
| DeepSeek V4 Flash | [Kimi K2.5: Visual Agentic Intelligence](https://arxiv.org/abs/2602.02276v1) | ok | $0.004537 | 87.8s | 4 | 0 | — |
| DeepSeek V4 Flash | [Intern-S1: A Scientific Multimodal Foundation Model](https://arxiv.org/abs/2508.15763v2) | ok | $0.004397 | 97.1s | 4 | 0 | — |
| DeepSeek V4 Flash | [CiteVQA: Benchmarking Evidence Attribution for Trustworthy Document Intelligence](https://arxiv.org/abs/2605.12882v1) | ok | $0.003902 | 71.1s | 3 | 0 | — |
| DeepSeek V4 Flash | [DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models](https://arxiv.org/abs/2512.02556v1) | ok | $0.003117 | 102.8s | 3 | 0 | — |
| DeepSeek V4 Flash | [VLA-Adapter: An Effective Paradigm for Tiny-Scale Vision-Language-Action Model](https://arxiv.org/abs/2509.09372v2) | ok | $0.004137 | 46.7s | 3 | 0 | — |
| DeepSeek V4 Flash | [Crafter: A Multi-Agent Harness for Editable Scientific Figure Generation from Diverse Inputs](https://arxiv.org/abs/2605.30611v1) | ok | $0.003126 | 153.1s | 3 | 1 | — |
| DeepSeek V4 Flash | [Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664v1) | failed | $0.001738 | 160.4s | 1 | 2 | 2/3 chunk requests failed: fetch failed; fetch failed |
| DeepSeek V4 Flash | [Attention Residuals](https://arxiv.org/abs/2603.15031v1) | ok | $0.003735 | 162.5s | 3 | 1 | — |
| DeepSeek V4 Flash | [MiniMax Sparse Attention](https://arxiv.org/abs/2606.13392v2) | ok | $0.003899 | 79.0s | 3 | 0 | — |
| DeepSeek V4 Flash | [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692v2) | ok | $0.004716 | 70.4s | 3 | 0 | — |
| DeepSeek V4 Flash | [LongHorizon-Harness: Advancing Long-Horizon Agents for Real-World Tasks](https://arxiv.org/abs/2608.01964v1) | ok | $0.005065 | 154.7s | 4 | 1 | — |
| DeepSeek V4 Flash | [SwanTale: Unified Multi-Speaker Speech and Audio Generation for Instruct and Zero-Shot Tasks](https://arxiv.org/abs/2608.02023v1) | ok | $0.005178 | 94.4s | 4 | 0 | — |
| DeepSeek V4 Flash | [Towards Scalable Pre-training of Visual Tokenizers for Generation](https://arxiv.org/abs/2512.13687v2) | ok | $0.002422 | 103.8s | 3 | 0 | — |
| DeepSeek V4 Flash | [DeepSeekMath-V2: Towards Self-Verifiable Mathematical Reasoning](https://arxiv.org/abs/2511.22570v1) | ok | $0.002072 | 62.4s | 2 | 0 | — |
| DeepSeek V4 Flash | [DeepSeek-OCR: Contexts Optical Compression](https://arxiv.org/abs/2510.18234v1) | ok | $0.002753 | 117.4s | 3 | 0 | — |
| DeepSeek V4 Flash | [MaxProof: Scaling Mathematical Proof with Generative-Verifier RL and Population-Level Test-Time Scaling](https://arxiv.org/abs/2606.13473v1) | failed | $0.007026 | 180.0s | 3 | 2 | 1/4 chunk requests failed: Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [DeepSeek-OCR 2: Visual Causal Flow](https://arxiv.org/abs/2601.20552v1) | ok | $0.002040 | 94.9s | 2 | 0 | — |
| DeepSeek V4 Flash | [DualPath: Breaking the Storage Bandwidth Bottleneck in Agentic LLM Inference](https://arxiv.org/abs/2602.21548v2) | ok | $0.003530 | 98.8s | 3 | 0 | — |
| DeepSeek V4 Flash | [The MiniMax-M2 Series: Mini Activations Unleashing Max Real-World Intelligence](https://arxiv.org/abs/2605.26494v2) | ok | $0.004501 | 148.4s | 4 | 0 | — |
| DeepSeek V4 Flash | [DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation](https://arxiv.org/abs/2607.05147v1) | failed | $0.004544 | 181.0s | 3 | 3 | Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [Reasoning Models Struggle to Control their Chains of Thought](https://arxiv.org/abs/2603.05706v1) | failed | $0.005937 | 181.0s | 3 | 2 | Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [PerceptionBench: Evaluating Atomic Visual Perception in Multimodal Large Language Models](https://arxiv.org/abs/2607.24957v1) | ok | $0.003076 | 129.3s | 3 | 0 | — |
| DeepSeek V4 Flash | [How AI Impacts Skill Formation](https://arxiv.org/abs/2601.20245v2) | ok | $0.002962 | 111.3s | 3 | 0 | — |
| DeepSeek V4 Flash | [WorldVQA: Measuring Atomic World Knowledge in Multimodal Large Language Models](https://arxiv.org/abs/2602.02537v1) | ok | $0.001848 | 55.9s | 2 | 0 | — |
| DeepSeek V4 Flash | [GDPval: Evaluating AI Model Performance on Real-World Economically Valuable Tasks](https://arxiv.org/abs/2510.04374v1) | ok | $0.003051 | 46.4s | 3 | 0 | — |
| DeepSeek V4 Flash | [Poisoning Attacks on LLMs Require a Near-constant Number of Poison Samples](https://arxiv.org/abs/2510.07192v1) | failed | $0.004061 | 181.0s | 3 | 2 | Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [Weight-sparse transformers have interpretable circuits](https://arxiv.org/abs/2511.13653v1) | failed | $0.004231 | 181.0s | 3 | 2 | Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [Training LLMs for Honesty via Confessions](https://arxiv.org/abs/2512.08093v2) | ok | $0.005205 | 151.3s | 4 | 1 | — |
| DeepSeek V4 Flash | [Constitutional Classifiers++: Efficient Production-Grade Defenses against Universal Jailbreaks](https://arxiv.org/abs/2601.04603v1) | ok | $0.002604 | 87.1s | 3 | 0 | — |
| DeepSeek V4 Flash | [Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models](https://arxiv.org/abs/2601.07372v2) | failed | $0.004230 | 180.0s | 2 | 2 | 1/3 chunk requests failed: Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [Who's in Charge? Disempowerment Patterns in Real-World LLM Usage](https://arxiv.org/abs/2601.19062v1) | failed | $0.006465 | 181.1s | 4 | 6 | 4/8 chunk requests failed: Document exceeded 180000ms deadline; Document exceeded 180000ms deadline; Document exceeded 180000ms deadline; Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [Cross-Architecture Model Diffing with Crosscoders: Unsupervised Discovery of Differences Between LLMs](https://arxiv.org/abs/2602.11729v1) | failed | $0.005541 | 180.0s | 3 | 3 | 2/5 chunk requests failed: Document exceeded 180000ms deadline; Document exceeded 180000ms deadline |
| DeepSeek V4 Flash | [IH-Challenge: A Training Dataset to Improve Instruction Hierarchy on Frontier LLMs](https://arxiv.org/abs/2603.10521v1) | ok | $0.002855 | 71.9s | 3 | 0 | — |
| DeepSeek V4 Flash | [Predicting LLM Safety Before Release by Simulating Deployment](https://arxiv.org/abs/2607.07184v1) | ok | $0.003363 | 80.4s | 3 | 0 | — |
| Qwen3.5 9B | [Sharing is Caring: Efficient LM Post-Training with Collective RL Experience Sharing](https://arxiv.org/abs/2509.08721v1) | ok | $0.002579 | 19.9s | 2 | 0 | — |
| Qwen3.5 9B | [GrandCode: Achieving Grandmaster Level in Competitive Programming via Agentic Reinforcement Learning](https://arxiv.org/abs/2604.02721v2) | ok | $0.004188 | 29.4s | 3 | 0 | — |
| Qwen3.5 9B | [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain](https://arxiv.org/abs/2509.26507v1) | ok | $0.013490 | 71.1s | 7 | 0 | — |
| Qwen3.5 9B | [ABot-Earth 0.5: Generative 3D Earth Model](https://arxiv.org/abs/2606.09967v1) | ok | $0.002876 | 19.2s | 3 | 0 | — |
| Qwen3.5 9B | [Orca: The World is in Your Mind](https://arxiv.org/abs/2606.30534v3) | ok | $0.007010 | 22.9s | 4 | 0 | — |
| Qwen3.5 9B | [Kimi K3: Open Frontier Intelligence](https://arxiv.org/abs/2607.24653v1) | ok | $0.010669 | 28.5s | 5 | 0 | — |
| Qwen3.5 9B | [Gamma-World: Generative Multi-Agent World Modeling Beyond Two Players](https://arxiv.org/abs/2605.28816v1) | ok | $0.003699 | 17.0s | 3 | 0 | — |
| Qwen3.5 9B | [AI Can Learn Scientific Taste](https://arxiv.org/abs/2603.14473v2) | ok | $0.008635 | 18.5s | 5 | 0 | — |
| Qwen3.5 9B | [Demystifying Video Reasoning](https://arxiv.org/abs/2603.16870v3) | ok | $0.004128 | 13.8s | 3 | 0 | — |
| Qwen3.5 9B | [MolmoAct2: Action Reasoning Models for Real-world Deployment](https://arxiv.org/abs/2605.02881v2) | ok | $0.011047 | 23.2s | 5 | 0 | — |
| Qwen3.5 9B | [A.S.E: A Repository-Level Benchmark for Evaluating Security in AI-Generated Code](https://arxiv.org/abs/2508.18106v3) | ok | $0.004570 | 22.0s | 3 | 0 | — |
| Qwen3.5 9B | [CARLA-Air: Fly Drones Inside a CARLA World -- A Unified Infrastructure for Air-Ground Embodied Intelligence](https://arxiv.org/abs/2603.28032v2) | ok | $0.003215 | 16.4s | 3 | 0 | — |
| Qwen3.5 9B | [Green-VLA: Staged Vision-Language-Action Model for Generalist Robots](https://arxiv.org/abs/2602.00919v2) | ok | $0.004712 | 16.3s | 3 | 0 | — |
| Qwen3.5 9B | [AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis](https://arxiv.org/abs/2607.28618v1) | ok | $0.001925 | 10.8s | 2 | 0 | — |
| Qwen3.5 9B | [Recursive Multi-Agent Systems](https://arxiv.org/abs/2604.25917v2) | ok | $0.005878 | 27.7s | 4 | 0 | — |
| Qwen3.5 9B | [Kimi K2.5: Visual Agentic Intelligence](https://arxiv.org/abs/2602.02276v1) | ok | $0.006306 | 24.2s | 4 | 0 | — |
| Qwen3.5 9B | [Intern-S1: A Scientific Multimodal Foundation Model](https://arxiv.org/abs/2508.15763v2) | ok | $0.005620 | 42.8s | 4 | 1 | — |
| Qwen3.5 9B | [CiteVQA: Benchmarking Evidence Attribution for Trustworthy Document Intelligence](https://arxiv.org/abs/2605.12882v1) | ok | $0.005275 | 26.9s | 3 | 0 | — |
| Qwen3.5 9B | [DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models](https://arxiv.org/abs/2512.02556v1) | ok | $0.003994 | 19.2s | 3 | 0 | — |
| Qwen3.5 9B | [VLA-Adapter: An Effective Paradigm for Tiny-Scale Vision-Language-Action Model](https://arxiv.org/abs/2509.09372v2) | ok | $0.005608 | 15.8s | 3 | 0 | — |
| Qwen3.5 9B | [Crafter: A Multi-Agent Harness for Editable Scientific Figure Generation from Diverse Inputs](https://arxiv.org/abs/2605.30611v1) | ok | $0.003895 | 14.9s | 3 | 0 | — |
| Qwen3.5 9B | [Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664v1) | ok | $0.006098 | 27.0s | 4 | 0 | — |
| Qwen3.5 9B | [Attention Residuals](https://arxiv.org/abs/2603.15031v1) | ok | $0.004654 | 15.6s | 3 | 0 | — |
| Qwen3.5 9B | [MiniMax Sparse Attention](https://arxiv.org/abs/2606.13392v2) | ok | $0.005231 | 28.0s | 3 | 0 | — |
| Qwen3.5 9B | [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692v2) | ok | $0.006456 | 21.9s | 3 | 0 | — |
| Qwen3.5 9B | [LongHorizon-Harness: Advancing Long-Horizon Agents for Real-World Tasks](https://arxiv.org/abs/2608.01964v1) | ok | $0.006329 | 28.0s | 4 | 0 | — |
| Qwen3.5 9B | [SwanTale: Unified Multi-Speaker Speech and Audio Generation for Instruct and Zero-Shot Tasks](https://arxiv.org/abs/2608.02023v1) | ok | $0.006822 | 18.4s | 4 | 0 | — |
| Qwen3.5 9B | [Towards Scalable Pre-training of Visual Tokenizers for Generation](https://arxiv.org/abs/2512.13687v2) | ok | $0.003011 | 12.1s | 3 | 0 | — |
| Qwen3.5 9B | [DeepSeekMath-V2: Towards Self-Verifiable Mathematical Reasoning](https://arxiv.org/abs/2511.22570v1) | ok | $0.002798 | 12.3s | 2 | 0 | — |
| Qwen3.5 9B | [DeepSeek-OCR: Contexts Optical Compression](https://arxiv.org/abs/2510.18234v1) | ok | $0.003487 | 13.6s | 3 | 0 | — |
| Qwen3.5 9B | [DeepSeek-OCR 2: Visual Causal Flow](https://arxiv.org/abs/2601.20552v1) | ok | $0.002731 | 9.4s | 2 | 0 | — |
| Qwen3.5 9B | [DualPath: Breaking the Storage Bandwidth Bottleneck in Agentic LLM Inference](https://arxiv.org/abs/2602.21548v2) | ok | $0.004482 | 11.6s | 3 | 0 | — |
| Qwen3.5 9B | [The MiniMax-M2 Series: Mini Activations Unleashing Max Real-World Intelligence](https://arxiv.org/abs/2605.26494v2) | ok | $0.005551 | 16.7s | 4 | 0 | — |
| Qwen3.5 9B | [DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation](https://arxiv.org/abs/2607.05147v1) | ok | $0.006222 | 30.0s | 4 | 0 | — |
| Qwen3.5 9B | [Reasoning Models Struggle to Control their Chains of Thought](https://arxiv.org/abs/2603.05706v1) | ok | $0.007849 | 20.8s | 4 | 0 | — |
| Qwen3.5 9B | [PerceptionBench: Evaluating Atomic Visual Perception in Multimodal Large Language Models](https://arxiv.org/abs/2607.24957v1) | ok | $0.003916 | 17.0s | 3 | 0 | — |
| Qwen3.5 9B | [How AI Impacts Skill Formation](https://arxiv.org/abs/2601.20245v2) | ok | $0.003716 | 33.0s | 3 | 0 | — |
| Qwen3.5 9B | [WorldVQA: Measuring Atomic World Knowledge in Multimodal Large Language Models](https://arxiv.org/abs/2602.02537v1) | ok | $0.002399 | 12.2s | 2 | 0 | — |
| Qwen3.5 9B | [GDPval: Evaluating AI Model Performance on Real-World Economically Valuable Tasks](https://arxiv.org/abs/2510.04374v1) | ok | $0.004016 | 27.1s | 3 | 0 | — |
| Qwen3.5 9B | [mHC: Manifold-Constrained Hyper-Connections](https://arxiv.org/abs/2512.24880v2) | ok | $0.003934 | 12.6s | 3 | 0 | — |
| Qwen3.5 9B | [MaxProof: Scaling Mathematical Proof with Generative-Verifier RL and Population-Level Test-Time Scaling](https://arxiv.org/abs/2606.13473v1) | ok | $0.013025 | 23.8s | 5 | 0 | — |
| Qwen3.5 9B | [Poisoning Attacks on LLMs Require a Near-constant Number of Poison Samples](https://arxiv.org/abs/2510.07192v1) | ok | $0.005637 | 16.5s | 4 | 0 | — |
| Qwen3.5 9B | [Weight-sparse transformers have interpretable circuits](https://arxiv.org/abs/2511.13653v1) | ok | $0.005659 | 16.0s | 4 | 0 | — |
| Qwen3.5 9B | [Training LLMs for Honesty via Confessions](https://arxiv.org/abs/2512.08093v2) | ok | $0.006653 | 17.6s | 4 | 0 | — |
| Qwen3.5 9B | [Constitutional Classifiers++: Efficient Production-Grade Defenses against Universal Jailbreaks](https://arxiv.org/abs/2601.04603v1) | ok | $0.003280 | 16.3s | 3 | 0 | — |
| Qwen3.5 9B | [Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models](https://arxiv.org/abs/2601.07372v2) | ok | $0.006465 | 25.4s | 4 | 0 | — |
| Qwen3.5 9B | [Who's in Charge? Disempowerment Patterns in Real-World LLM Usage](https://arxiv.org/abs/2601.19062v1) | ok | $0.015891 | 59.3s | 9 | 0 | — |
| Qwen3.5 9B | [Cross-Architecture Model Diffing with Crosscoders: Unsupervised Discovery of Differences Between LLMs](https://arxiv.org/abs/2602.11729v1) | ok | $0.011033 | 38.0s | 6 | 0 | — |
| Qwen3.5 9B | [IH-Challenge: A Training Dataset to Improve Instruction Hierarchy on Frontier LLMs](https://arxiv.org/abs/2603.10521v1) | ok | $0.003674 | 27.4s | 3 | 0 | — |
| Qwen3.5 9B | [Predicting LLM Safety Before Release by Simulating Deployment](https://arxiv.org/abs/2607.07184v1) | ok | $0.004252 | 19.8s | 3 | 0 | — |
| MiniMax M3 | [Sharing is Caring: Efficient LM Post-Training with Collective RL Experience Sharing](https://arxiv.org/abs/2509.08721v1) | ok | $0.005309 | 19.9s | 2 | 0 | — |
| MiniMax M3 | [GrandCode: Achieving Grandmaster Level in Competitive Programming via Agentic Reinforcement Learning](https://arxiv.org/abs/2604.02721v2) | ok | $0.008479 | 22.3s | 3 | 0 | — |
| MiniMax M3 | [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain](https://arxiv.org/abs/2509.26507v1) | ok | $0.025843 | 56.9s | 7 | 0 | — |
| MiniMax M3 | [ABot-Earth 0.5: Generative 3D Earth Model](https://arxiv.org/abs/2606.09967v1) | ok | $0.005426 | 11.8s | 3 | 0 | — |
| MiniMax M3 | [Kimi K3: Open Frontier Intelligence](https://arxiv.org/abs/2607.24653v1) | ok | $0.019309 | 26.8s | 5 | 0 | — |
| MiniMax M3 | [Gamma-World: Generative Multi-Agent World Modeling Beyond Two Players](https://arxiv.org/abs/2605.28816v1) | ok | $0.007081 | 16.2s | 3 | 0 | — |
| MiniMax M3 | [AI Can Learn Scientific Taste](https://arxiv.org/abs/2603.14473v2) | ok | $0.015626 | 21.1s | 5 | 0 | — |
| MiniMax M3 | [Demystifying Video Reasoning](https://arxiv.org/abs/2603.16870v3) | ok | $0.007755 | 14.2s | 3 | 0 | — |
| MiniMax M3 | [MolmoAct2: Action Reasoning Models for Real-world Deployment](https://arxiv.org/abs/2605.02881v2) | ok | $0.020133 | 54.0s | 5 | 0 | — |
| MiniMax M3 | [A.S.E: A Repository-Level Benchmark for Evaluating Security in AI-Generated Code](https://arxiv.org/abs/2508.18106v3) | ok | $0.008203 | 28.1s | 3 | 0 | — |
| MiniMax M3 | [CARLA-Air: Fly Drones Inside a CARLA World -- A Unified Infrastructure for Air-Ground Embodied Intelligence](https://arxiv.org/abs/2603.28032v2) | ok | $0.006626 | 32.6s | 3 | 0 | — |
| MiniMax M3 | [mHC: Manifold-Constrained Hyper-Connections](https://arxiv.org/abs/2512.24880v2) | ok | $0.008101 | 33.9s | 3 | 0 | — |
| MiniMax M3 | [Green-VLA: Staged Vision-Language-Action Model for Generalist Robots](https://arxiv.org/abs/2602.00919v2) | ok | $0.009867 | 36.8s | 3 | 0 | — |
| MiniMax M3 | [AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis](https://arxiv.org/abs/2607.28618v1) | ok | $0.004224 | 15.1s | 2 | 0 | — |
| MiniMax M3 | [Recursive Multi-Agent Systems](https://arxiv.org/abs/2604.25917v2) | ok | $0.011411 | 36.0s | 4 | 0 | — |
| MiniMax M3 | [Kimi K2.5: Visual Agentic Intelligence](https://arxiv.org/abs/2602.02276v1) | ok | $0.012844 | 39.6s | 4 | 0 | — |
| MiniMax M3 | [Intern-S1: A Scientific Multimodal Foundation Model](https://arxiv.org/abs/2508.15763v2) | ok | $0.010743 | 37.0s | 4 | 0 | — |
| MiniMax M3 | [CiteVQA: Benchmarking Evidence Attribution for Trustworthy Document Intelligence](https://arxiv.org/abs/2605.12882v1) | ok | $0.010260 | 35.7s | 3 | 0 | — |
| MiniMax M3 | [DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models](https://arxiv.org/abs/2512.02556v1) | ok | $0.007975 | 25.2s | 3 | 0 | — |
| MiniMax M3 | [VLA-Adapter: An Effective Paradigm for Tiny-Scale Vision-Language-Action Model](https://arxiv.org/abs/2509.09372v2) | ok | $0.010877 | 29.0s | 3 | 0 | — |
| MiniMax M3 | [Crafter: A Multi-Agent Harness for Editable Scientific Figure Generation from Diverse Inputs](https://arxiv.org/abs/2605.30611v1) | ok | $0.008195 | 23.2s | 3 | 0 | — |
| MiniMax M3 | [Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664v1) | ok | $0.010918 | 18.1s | 4 | 0 | — |
| MiniMax M3 | [Attention Residuals](https://arxiv.org/abs/2603.15031v1) | ok | $0.009812 | 23.7s | 3 | 0 | — |
| MiniMax M3 | [MiniMax Sparse Attention](https://arxiv.org/abs/2606.13392v2) | ok | $0.011101 | 28.1s | 3 | 0 | — |
| MiniMax M3 | [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692v2) | ok | $0.012159 | 25.7s | 3 | 0 | — |
| MiniMax M3 | [LongHorizon-Harness: Advancing Long-Horizon Agents for Real-World Tasks](https://arxiv.org/abs/2608.01964v1) | ok | $0.012453 | 34.8s | 4 | 0 | — |
| MiniMax M3 | [SwanTale: Unified Multi-Speaker Speech and Audio Generation for Instruct and Zero-Shot Tasks](https://arxiv.org/abs/2608.02023v1) | ok | $0.013632 | 32.6s | 4 | 0 | — |
| MiniMax M3 | [Towards Scalable Pre-training of Visual Tokenizers for Generation](https://arxiv.org/abs/2512.13687v2) | ok | $0.006349 | 21.4s | 3 | 0 | — |
| MiniMax M3 | [DeepSeekMath-V2: Towards Self-Verifiable Mathematical Reasoning](https://arxiv.org/abs/2511.22570v1) | ok | $0.005542 | 19.7s | 2 | 0 | — |
| MiniMax M3 | [DeepSeek-OCR: Contexts Optical Compression](https://arxiv.org/abs/2510.18234v1) | ok | $0.006554 | 25.0s | 3 | 0 | — |
| MiniMax M3 | [The MiniMax-M2 Series: Mini Activations Unleashing Max Real-World Intelligence](https://arxiv.org/abs/2605.26494v2) | ok | $0.011510 | 65.2s | 4 | 3 | — |
| MiniMax M3 | [DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation](https://arxiv.org/abs/2607.05147v1) | ok | $0.012626 | 29.4s | 4 | 0 | — |
| MiniMax M3 | [Reasoning Models Struggle to Control their Chains of Thought](https://arxiv.org/abs/2603.05706v1) | ok | $0.015676 | 29.2s | 4 | 0 | — |
| MiniMax M3 | [PerceptionBench: Evaluating Atomic Visual Perception in Multimodal Large Language Models](https://arxiv.org/abs/2607.24957v1) | ok | $0.008301 | 21.2s | 3 | 0 | — |
| MiniMax M3 | [How AI Impacts Skill Formation](https://arxiv.org/abs/2601.20245v2) | ok | $0.007237 | 18.4s | 3 | 0 | — |
| MiniMax M3 | [WorldVQA: Measuring Atomic World Knowledge in Multimodal Large Language Models](https://arxiv.org/abs/2602.02537v1) | ok | $0.004422 | 10.3s | 2 | 0 | — |
| MiniMax M3 | [GDPval: Evaluating AI Model Performance on Real-World Economically Valuable Tasks](https://arxiv.org/abs/2510.04374v1) | ok | $0.007867 | 16.0s | 3 | 0 | — |
| MiniMax M3 | [Poisoning Attacks on LLMs Require a Near-constant Number of Poison Samples](https://arxiv.org/abs/2510.07192v1) | ok | $0.010963 | 24.8s | 4 | 0 | — |
| MiniMax M3 | [Weight-sparse transformers have interpretable circuits](https://arxiv.org/abs/2511.13653v1) | ok | $0.011445 | 32.9s | 4 | 0 | — |
| MiniMax M3 | [Training LLMs for Honesty via Confessions](https://arxiv.org/abs/2512.08093v2) | ok | $0.012447 | 23.6s | 4 | 0 | — |
| MiniMax M3 | [Constitutional Classifiers++: Efficient Production-Grade Defenses against Universal Jailbreaks](https://arxiv.org/abs/2601.04603v1) | ok | $0.006614 | 15.2s | 3 | 0 | — |
| MiniMax M3 | [Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models](https://arxiv.org/abs/2601.07372v2) | ok | $0.012140 | 46.1s | 4 | 0 | — |
| MiniMax M3 | [Who's in Charge? Disempowerment Patterns in Real-World LLM Usage](https://arxiv.org/abs/2601.19062v1) | ok | $0.030408 | 59.7s | 9 | 0 | — |
| MiniMax M3 | [Cross-Architecture Model Diffing with Crosscoders: Unsupervised Discovery of Differences Between LLMs](https://arxiv.org/abs/2602.11729v1) | ok | $0.021967 | 40.7s | 6 | 0 | — |
| MiniMax M3 | [IH-Challenge: A Training Dataset to Improve Instruction Hierarchy on Frontier LLMs](https://arxiv.org/abs/2603.10521v1) | ok | $0.006834 | 16.6s | 3 | 0 | — |
| MiniMax M3 | [Predicting LLM Safety Before Release by Simulating Deployment](https://arxiv.org/abs/2607.07184v1) | ok | $0.008329 | 17.6s | 3 | 0 | — |
| MiniMax M3 | [Orca: The World is in Your Mind](https://arxiv.org/abs/2606.30534v3) | ok | $0.013205 | 11.9s | 4 | 0 | — |
| MiniMax M3 | [DeepSeek-OCR 2: Visual Causal Flow](https://arxiv.org/abs/2601.20552v1) | ok | $0.005150 | 11.8s | 2 | 0 | — |
| MiniMax M3 | [DualPath: Breaking the Storage Bandwidth Bottleneck in Agentic LLM Inference](https://arxiv.org/abs/2602.21548v2) | ok | $0.008591 | 18.9s | 3 | 0 | — |
| MiniMax M3 | [MaxProof: Scaling Mathematical Proof with Generative-Verifier RL and Population-Level Test-Time Scaling](https://arxiv.org/abs/2606.13473v1) | ok | $0.024742 | 22.3s | 5 | 0 | — |
| Claude Haiku 4.5 | [Sharing is Caring: Efficient LM Post-Training with Collective RL Experience Sharing](https://arxiv.org/abs/2509.08721v1) | ok | $0.021041 | 13.7s | 2 | 0 | — |
| Claude Haiku 4.5 | [GrandCode: Achieving Grandmaster Level in Competitive Programming via Agentic Reinforcement Learning](https://arxiv.org/abs/2604.02721v2) | ok | $0.033350 | 22.5s | 3 | 0 | — |
| Claude Haiku 4.5 | [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain](https://arxiv.org/abs/2509.26507v1) | ok | $0.106484 | 66.7s | 7 | 0 | — |
| Claude Haiku 4.5 | [ABot-Earth 0.5: Generative 3D Earth Model](https://arxiv.org/abs/2606.09967v1) | ok | $0.024037 | 20.4s | 3 | 0 | — |
| Claude Haiku 4.5 | [Orca: The World is in Your Mind](https://arxiv.org/abs/2606.30534v3) | ok | $0.058508 | 40.2s | 4 | 0 | — |
| Claude Haiku 4.5 | [Gamma-World: Generative Multi-Agent World Modeling Beyond Two Players](https://arxiv.org/abs/2605.28816v1) | ok | $0.028956 | 19.0s | 3 | 0 | — |
| Claude Haiku 4.5 | [AI Can Learn Scientific Taste](https://arxiv.org/abs/2603.14473v2) | ok | $0.067412 | 41.9s | 5 | 0 | — |
| Claude Haiku 4.5 | [Demystifying Video Reasoning](https://arxiv.org/abs/2603.16870v3) | ok | $0.030525 | 21.0s | 3 | 0 | — |
| Claude Haiku 4.5 | [MolmoAct2: Action Reasoning Models for Real-world Deployment](https://arxiv.org/abs/2605.02881v2) | ok | $0.081319 | 68.5s | 5 | 0 | — |
| Claude Haiku 4.5 | [A.S.E: A Repository-Level Benchmark for Evaluating Security in AI-Generated Code](https://arxiv.org/abs/2508.18106v3) | ok | $0.036167 | 41.5s | 3 | 0 | — |
| Claude Haiku 4.5 | [CARLA-Air: Fly Drones Inside a CARLA World -- A Unified Infrastructure for Air-Ground Embodied Intelligence](https://arxiv.org/abs/2603.28032v2) | ok | $0.027763 | 23.9s | 3 | 0 | — |
| Claude Haiku 4.5 | [mHC: Manifold-Constrained Hyper-Connections](https://arxiv.org/abs/2512.24880v2) | ok | $0.032028 | 21.7s | 3 | 0 | — |
| Claude Haiku 4.5 | [Green-VLA: Staged Vision-Language-Action Model for Generalist Robots](https://arxiv.org/abs/2602.00919v2) | ok | $0.039796 | 34.5s | 3 | 0 | — |
| Claude Haiku 4.5 | [AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis](https://arxiv.org/abs/2607.28618v1) | ok | $0.016036 | 15.8s | 2 | 0 | — |
| Claude Haiku 4.5 | [Recursive Multi-Agent Systems](https://arxiv.org/abs/2604.25917v2) | ok | $0.047505 | 38.8s | 4 | 0 | — |
| Claude Haiku 4.5 | [Kimi K2.5: Visual Agentic Intelligence](https://arxiv.org/abs/2602.02276v1) | ok | $0.047620 | 46.0s | 4 | 0 | — |
| Claude Haiku 4.5 | [Intern-S1: A Scientific Multimodal Foundation Model](https://arxiv.org/abs/2508.15763v2) | ok | $0.046579 | 38.8s | 4 | 0 | — |
| Claude Haiku 4.5 | [CiteVQA: Benchmarking Evidence Attribution for Trustworthy Document Intelligence](https://arxiv.org/abs/2605.12882v1) | ok | $0.038034 | 20.6s | 3 | 0 | — |
| Claude Haiku 4.5 | [DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models](https://arxiv.org/abs/2512.02556v1) | ok | $0.032365 | 23.6s | 3 | 0 | — |
| Claude Haiku 4.5 | [VLA-Adapter: An Effective Paradigm for Tiny-Scale Vision-Language-Action Model](https://arxiv.org/abs/2509.09372v2) | ok | $0.043408 | 27.1s | 3 | 0 | — |
| Claude Haiku 4.5 | [Crafter: A Multi-Agent Harness for Editable Scientific Figure Generation from Diverse Inputs](https://arxiv.org/abs/2605.30611v1) | ok | $0.034106 | 30.1s | 3 | 0 | — |
| Claude Haiku 4.5 | [Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664v1) | ok | $0.047609 | 25.6s | 4 | 0 | — |
| Claude Haiku 4.5 | [MiniMax Sparse Attention](https://arxiv.org/abs/2606.13392v2) | ok | $0.044062 | 26.8s | 3 | 0 | — |
| Claude Haiku 4.5 | [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692v2) | ok | $0.048522 | 44.2s | 3 | 0 | — |
| Claude Haiku 4.5 | [LongHorizon-Harness: Advancing Long-Horizon Agents for Real-World Tasks](https://arxiv.org/abs/2608.01964v1) | ok | $0.049428 | 71.8s | 4 | 0 | — |
| Claude Haiku 4.5 | [Kimi K3: Open Frontier Intelligence](https://arxiv.org/abs/2607.24653v1) | ok | $0.086345 | 26.0s | 5 | 0 | — |
| Claude Haiku 4.5 | [Attention Residuals](https://arxiv.org/abs/2603.15031v1) | ok | $0.038149 | 29.4s | 3 | 0 | — |
| Claude Haiku 4.5 | [SwanTale: Unified Multi-Speaker Speech and Audio Generation for Instruct and Zero-Shot Tasks](https://arxiv.org/abs/2608.02023v1) | ok | $0.054517 | 36.1s | 4 | 0 | — |
| Claude Haiku 4.5 | [Towards Scalable Pre-training of Visual Tokenizers for Generation](https://arxiv.org/abs/2512.13687v2) | ok | $0.025288 | 18.2s | 3 | 0 | — |
| Claude Haiku 4.5 | [DeepSeekMath-V2: Towards Self-Verifiable Mathematical Reasoning](https://arxiv.org/abs/2511.22570v1) | ok | $0.021271 | 45.3s | 2 | 0 | — |
| Claude Haiku 4.5 | [DeepSeek-OCR: Contexts Optical Compression](https://arxiv.org/abs/2510.18234v1) | ok | $0.027895 | 22.5s | 3 | 0 | — |
| Claude Haiku 4.5 | [MaxProof: Scaling Mathematical Proof with Generative-Verifier RL and Population-Level Test-Time Scaling](https://arxiv.org/abs/2606.13473v1) | ok | $0.108915 | 47.0s | 5 | 0 | — |
| Claude Haiku 4.5 | [DeepSeek-OCR 2: Visual Causal Flow](https://arxiv.org/abs/2601.20552v1) | ok | $0.020710 | 12.5s | 2 | 0 | — |
| Claude Haiku 4.5 | [DualPath: Breaking the Storage Bandwidth Bottleneck in Agentic LLM Inference](https://arxiv.org/abs/2602.21548v2) | ok | $0.038449 | 27.8s | 3 | 0 | — |
| Claude Haiku 4.5 | [The MiniMax-M2 Series: Mini Activations Unleashing Max Real-World Intelligence](https://arxiv.org/abs/2605.26494v2) | ok | $0.050505 | 44.2s | 4 | 0 | — |
| Claude Haiku 4.5 | [DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation](https://arxiv.org/abs/2607.05147v1) | ok | $0.048090 | 28.5s | 4 | 0 | — |
| Claude Haiku 4.5 | [Reasoning Models Struggle to Control their Chains of Thought](https://arxiv.org/abs/2603.05706v1) | ok | $0.059933 | 28.7s | 4 | 0 | — |
| Claude Haiku 4.5 | [PerceptionBench: Evaluating Atomic Visual Perception in Multimodal Large Language Models](https://arxiv.org/abs/2607.24957v1) | ok | $0.031671 | 22.1s | 3 | 0 | — |
| Claude Haiku 4.5 | [How AI Impacts Skill Formation](https://arxiv.org/abs/2601.20245v2) | ok | $0.026499 | 16.9s | 3 | 0 | — |
| Claude Haiku 4.5 | [WorldVQA: Measuring Atomic World Knowledge in Multimodal Large Language Models](https://arxiv.org/abs/2602.02537v1) | ok | $0.017995 | 12.5s | 2 | 0 | — |
| Claude Haiku 4.5 | [GDPval: Evaluating AI Model Performance on Real-World Economically Valuable Tasks](https://arxiv.org/abs/2510.04374v1) | ok | $0.033632 | 28.4s | 3 | 0 | — |
| Claude Haiku 4.5 | [Poisoning Attacks on LLMs Require a Near-constant Number of Poison Samples](https://arxiv.org/abs/2510.07192v1) | ok | $0.043375 | 25.4s | 4 | 0 | — |
| Claude Haiku 4.5 | [Weight-sparse transformers have interpretable circuits](https://arxiv.org/abs/2511.13653v1) | ok | $0.045190 | 32.9s | 4 | 0 | — |
| Claude Haiku 4.5 | [Training LLMs for Honesty via Confessions](https://arxiv.org/abs/2512.08093v2) | ok | $0.048060 | 26.6s | 4 | 0 | — |
| Claude Haiku 4.5 | [Constitutional Classifiers++: Efficient Production-Grade Defenses against Universal Jailbreaks](https://arxiv.org/abs/2601.04603v1) | ok | $0.027885 | 21.9s | 3 | 0 | — |
| Claude Haiku 4.5 | [Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models](https://arxiv.org/abs/2601.07372v2) | ok | $0.050475 | 35.2s | 4 | 0 | — |
| Claude Haiku 4.5 | [Who's in Charge? Disempowerment Patterns in Real-World LLM Usage](https://arxiv.org/abs/2601.19062v1) | ok | $0.124789 | 84.7s | 9 | 0 | — |
| Claude Haiku 4.5 | [Cross-Architecture Model Diffing with Crosscoders: Unsupervised Discovery of Differences Between LLMs](https://arxiv.org/abs/2602.11729v1) | ok | $0.087938 | 59.0s | 6 | 0 | — |
| Claude Haiku 4.5 | [IH-Challenge: A Training Dataset to Improve Instruction Hierarchy on Frontier LLMs](https://arxiv.org/abs/2603.10521v1) | ok | $0.028096 | 18.7s | 3 | 0 | — |
| Claude Haiku 4.5 | [Predicting LLM Safety Before Release by Simulating Deployment](https://arxiv.org/abs/2607.07184v1) | ok | $0.034567 | 26.3s | 3 | 0 | — |
| GPT-5.6 Luna | [Sharing is Caring: Efficient LM Post-Training with Collective RL Experience Sharing](https://arxiv.org/abs/2509.08721v1) | ok | $0.003454 | 7.2s | 2 | 0 | — |
| GPT-5.6 Luna | [GrandCode: Achieving Grandmaster Level in Competitive Programming via Agentic Reinforcement Learning](https://arxiv.org/abs/2604.02721v2) | ok | $0.005731 | 12.1s | 3 | 0 | — |
| GPT-5.6 Luna | [The Dragon Hatchling: The Missing Link between the Transformer and Models of the Brain](https://arxiv.org/abs/2509.26507v1) | ok | $0.018655 | 40.1s | 7 | 0 | — |
| GPT-5.6 Luna | [ABot-Earth 0.5: Generative 3D Earth Model](https://arxiv.org/abs/2606.09967v1) | ok | $0.004408 | 10.9s | 3 | 0 | — |
| GPT-5.6 Luna | [Orca: The World is in Your Mind](https://arxiv.org/abs/2606.30534v3) | ok | $0.009902 | 17.3s | 4 | 0 | — |
| GPT-5.6 Luna | [Kimi K3: Open Frontier Intelligence](https://arxiv.org/abs/2607.24653v1) | ok | $0.014234 | 23.9s | 5 | 0 | — |
| GPT-5.6 Luna | [Gamma-World: Generative Multi-Agent World Modeling Beyond Two Players](https://arxiv.org/abs/2605.28816v1) | ok | $0.004814 | 9.6s | 3 | 0 | — |
| GPT-5.6 Luna | [AI Can Learn Scientific Taste](https://arxiv.org/abs/2603.14473v2) | ok | $0.011436 | 20.8s | 5 | 0 | — |
| GPT-5.6 Luna | [Demystifying Video Reasoning](https://arxiv.org/abs/2603.16870v3) | ok | $0.005491 | 11.5s | 3 | 0 | — |
| GPT-5.6 Luna | [MolmoAct2: Action Reasoning Models for Real-world Deployment](https://arxiv.org/abs/2605.02881v2) | ok | $0.014383 | 22.9s | 5 | 0 | — |
| GPT-5.6 Luna | [A.S.E: A Repository-Level Benchmark for Evaluating Security in AI-Generated Code](https://arxiv.org/abs/2508.18106v3) | ok | $0.005986 | 13.1s | 3 | 0 | — |
| GPT-5.6 Luna | [CARLA-Air: Fly Drones Inside a CARLA World -- A Unified Infrastructure for Air-Ground Embodied Intelligence](https://arxiv.org/abs/2603.28032v2) | ok | $0.004531 | 9.5s | 3 | 0 | — |
| GPT-5.6 Luna | [mHC: Manifold-Constrained Hyper-Connections](https://arxiv.org/abs/2512.24880v2) | ok | $0.005418 | 10.2s | 3 | 0 | — |
| GPT-5.6 Luna | [Green-VLA: Staged Vision-Language-Action Model for Generalist Robots](https://arxiv.org/abs/2602.00919v2) | ok | $0.006660 | 13.4s | 3 | 0 | — |
| GPT-5.6 Luna | [AskChem: Claim-Centered Infrastructure for Chemistry Literature Synthesis](https://arxiv.org/abs/2607.28618v1) | ok | $0.002887 | 6.7s | 2 | 0 | — |
| GPT-5.6 Luna | [Recursive Multi-Agent Systems](https://arxiv.org/abs/2604.25917v2) | ok | $0.007758 | 12.9s | 4 | 0 | — |
| GPT-5.6 Luna | [Kimi K2.5: Visual Agentic Intelligence](https://arxiv.org/abs/2602.02276v1) | ok | $0.008083 | 14.9s | 4 | 0 | — |
| GPT-5.6 Luna | [Intern-S1: A Scientific Multimodal Foundation Model](https://arxiv.org/abs/2508.15763v2) | ok | $0.007667 | 17.6s | 4 | 0 | — |
| GPT-5.6 Luna | [CiteVQA: Benchmarking Evidence Attribution for Trustworthy Document Intelligence](https://arxiv.org/abs/2605.12882v1) | ok | $0.006811 | 12.3s | 3 | 0 | — |
| GPT-5.6 Luna | [DeepSeek-V3.2: Pushing the Frontier of Open Large Language Models](https://arxiv.org/abs/2512.02556v1) | ok | $0.005638 | 11.1s | 3 | 0 | — |
| GPT-5.6 Luna | [VLA-Adapter: An Effective Paradigm for Tiny-Scale Vision-Language-Action Model](https://arxiv.org/abs/2509.09372v2) | ok | $0.007571 | 13.1s | 3 | 0 | — |
| GPT-5.6 Luna | [Crafter: A Multi-Agent Harness for Editable Scientific Figure Generation from Diverse Inputs](https://arxiv.org/abs/2605.30611v1) | ok | $0.005696 | 11.2s | 3 | 0 | — |
| GPT-5.6 Luna | [Why Language Models Hallucinate](https://arxiv.org/abs/2509.04664v1) | ok | $0.008277 | 15.2s | 4 | 0 | — |
| GPT-5.6 Luna | [Attention Residuals](https://arxiv.org/abs/2603.15031v1) | ok | $0.006476 | 13.4s | 3 | 0 | — |
| GPT-5.6 Luna | [MiniMax Sparse Attention](https://arxiv.org/abs/2606.13392v2) | ok | $0.006975 | 17.3s | 3 | 0 | — |
| GPT-5.6 Luna | [Kimi Linear: An Expressive, Efficient Attention Architecture](https://arxiv.org/abs/2510.26692v2) | ok | $0.008221 | 12.1s | 3 | 0 | — |
| GPT-5.6 Luna | [LongHorizon-Harness: Advancing Long-Horizon Agents for Real-World Tasks](https://arxiv.org/abs/2608.01964v1) | ok | $0.008238 | 13.8s | 4 | 0 | — |
| GPT-5.6 Luna | [SwanTale: Unified Multi-Speaker Speech and Audio Generation for Instruct and Zero-Shot Tasks](https://arxiv.org/abs/2608.02023v1) | ok | $0.009129 | 15.7s | 4 | 0 | — |
| GPT-5.6 Luna | [Towards Scalable Pre-training of Visual Tokenizers for Generation](https://arxiv.org/abs/2512.13687v2) | ok | $0.004298 | 9.3s | 3 | 0 | — |
| GPT-5.6 Luna | [DeepSeekMath-V2: Towards Self-Verifiable Mathematical Reasoning](https://arxiv.org/abs/2511.22570v1) | ok | $0.003528 | 6.8s | 2 | 0 | — |
| GPT-5.6 Luna | [DeepSeek-OCR: Contexts Optical Compression](https://arxiv.org/abs/2510.18234v1) | ok | $0.004601 | 9.1s | 3 | 0 | — |
| GPT-5.6 Luna | [MaxProof: Scaling Mathematical Proof with Generative-Verifier RL and Population-Level Test-Time Scaling](https://arxiv.org/abs/2606.13473v1) | ok | $0.018405 | 23.8s | 5 | 0 | — |
| GPT-5.6 Luna | [DeepSeek-OCR 2: Visual Causal Flow](https://arxiv.org/abs/2601.20552v1) | ok | $0.003685 | 7.0s | 2 | 0 | — |
| GPT-5.6 Luna | [DualPath: Breaking the Storage Bandwidth Bottleneck in Agentic LLM Inference](https://arxiv.org/abs/2602.21548v2) | ok | $0.006287 | 11.1s | 3 | 0 | — |
| GPT-5.6 Luna | [The MiniMax-M2 Series: Mini Activations Unleashing Max Real-World Intelligence](https://arxiv.org/abs/2605.26494v2) | ok | $0.008009 | 15.6s | 4 | 0 | — |
| GPT-5.6 Luna | [DSpark: Confidence-Scheduled Speculative Decoding with Semi-Autoregressive Generation](https://arxiv.org/abs/2607.05147v1) | ok | $0.008526 | 15.5s | 4 | 0 | — |
| GPT-5.6 Luna | [Reasoning Models Struggle to Control their Chains of Thought](https://arxiv.org/abs/2603.05706v1) | ok | $0.010345 | 16.2s | 4 | 0 | — |
| GPT-5.6 Luna | [PerceptionBench: Evaluating Atomic Visual Perception in Multimodal Large Language Models](https://arxiv.org/abs/2607.24957v1) | ok | $0.005308 | 10.4s | 3 | 0 | — |
| GPT-5.6 Luna | [How AI Impacts Skill Formation](https://arxiv.org/abs/2601.20245v2) | ok | $0.005418 | 12.1s | 3 | 0 | — |
| GPT-5.6 Luna | [WorldVQA: Measuring Atomic World Knowledge in Multimodal Large Language Models](https://arxiv.org/abs/2602.02537v1) | ok | $0.003310 | 7.1s | 2 | 0 | — |
| GPT-5.6 Luna | [GDPval: Evaluating AI Model Performance on Real-World Economically Valuable Tasks](https://arxiv.org/abs/2510.04374v1) | ok | $0.005969 | 13.6s | 3 | 0 | — |
| GPT-5.6 Luna | [Poisoning Attacks on LLMs Require a Near-constant Number of Poison Samples](https://arxiv.org/abs/2510.07192v1) | ok | $0.007666 | 19.6s | 4 | 0 | — |
| GPT-5.6 Luna | [Weight-sparse transformers have interpretable circuits](https://arxiv.org/abs/2511.13653v1) | ok | $0.007935 | 15.9s | 4 | 0 | — |
| GPT-5.6 Luna | [Training LLMs for Honesty via Confessions](https://arxiv.org/abs/2512.08093v2) | ok | $0.008894 | 17.0s | 4 | 0 | — |
| GPT-5.6 Luna | [Constitutional Classifiers++: Efficient Production-Grade Defenses against Universal Jailbreaks](https://arxiv.org/abs/2601.04603v1) | ok | $0.004972 | 11.6s | 3 | 0 | — |
| GPT-5.6 Luna | [Conditional Memory via Scalable Lookup: A New Axis of Sparsity for Large Language Models](https://arxiv.org/abs/2601.07372v2) | ok | $0.008609 | 17.5s | 4 | 0 | — |
| GPT-5.6 Luna | [Who's in Charge? Disempowerment Patterns in Real-World LLM Usage](https://arxiv.org/abs/2601.19062v1) | ok | $0.021690 | 42.9s | 9 | 0 | — |
| GPT-5.6 Luna | [Cross-Architecture Model Diffing with Crosscoders: Unsupervised Discovery of Differences Between LLMs](https://arxiv.org/abs/2602.11729v1) | ok | $0.015321 | 25.3s | 6 | 0 | — |
| GPT-5.6 Luna | [IH-Challenge: A Training Dataset to Improve Instruction Hierarchy on Frontier LLMs](https://arxiv.org/abs/2603.10521v1) | ok | $0.004946 | 10.6s | 3 | 0 | — |
| GPT-5.6 Luna | [Predicting LLM Safety Before Release by Simulating Deployment](https://arxiv.org/abs/2607.07184v1) | ok | $0.006043 | 12.7s | 3 | 0 | — |

## Method

- Every model receives the same locally extracted text, chunk boundaries, prompt, and final reduce pass.
- Extended reasoning is disabled. Provider-reported token usage and the frozen standard synchronous price produce each cost.
- Transient timeouts, rate limits, and server errors are retried with bounded exponential backoff; retry counts remain visible.
- Completion rate, cost, and latency are separate axes; a cheap or fast response is not presented as a factuality score.

