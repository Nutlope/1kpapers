# Blind judge selection: Kimi K3 vs GLM 5.2

Retrieved **2026-08-05**. No inference calls were made.

## Recommendation

Use **Kimi K3 (`moonshotai/Kimi-K3`) as the primary blind judge** and **GLM 5.2 (`zai-org/GLM-5.2`) as the second judge for validation**, not as a second judge on every full-corpus row.

### Measured preflight configuration

After this metadata research, the harness ran one paid A/B preflight on the same blinded candidate summary and 52K-token paper input. Kimi K3 at `high` effort scored 75.0, used 1,201 completion tokens, cost $0.174687, and completed in 15.4 seconds. At `max` effort it scored 75.3, used 3,766 completion tokens, cost $0.213159, and completed in 31.0 seconds. Because the score differed by only 0.3 while `high` materially reduced latency and output, the pilot uses **Kimi K3 at high effort**. This is a single-item operational preflight, not evidence that the two effort levels are quality-equivalent; the 15-paper human calibration remains the quality gate.

Kimi is the stronger primary choice for this particular task because the evidence favors its knowledge and document understanding, it has the safer long-context ceiling, and it is independent of the five proposed candidate summarizers. GLM costs less than half as much and is also independent, making it the right disagreement detector and audit model.

Recommended coverage:

- On the **50-paper pilot**, run both judges on every successful candidate summary. This establishes inter-judge agreement while keeping the human calibration checklists held out for the subsequent audit.
- On the **1,000-paper run**, run Kimi on every successful candidate summary, then run GLM on a stratified 10% audit, every Moonshot/Kimi-authored paper, low-confidence or malformed-evidence judgments, and any near-tie that could change the model ranking.
- Route score disagreements of 20 points or more to human review, as already specified in [`judge-spec.md`](./judge-spec.md).
- If Kimi K3 or GLM 5.2 is later added as a candidate summarizer, it must not judge its own output; use the other judge for those rows.

## Current serverless comparison

| Criterion | Kimi K3 | GLM 5.2 | Decision impact |
| --- | --- | --- | --- |
| Together model ID | `moonshotai/Kimi-K3` | `zai-org/GLM-5.2` | Both exact IDs are live chat models in the authenticated Together model API. |
| Standard input / cached / output | $3.00 / $0.30 / $15.00 per 1M | $1.40 / $0.26 / $4.40 per 1M | GLM is substantially cheaper. |
| Together public context | 1,000,000 | 262,144 | Kimi is safer for exceptionally long papers. Together's live API reports 512,000 for GLM, but use the lower public limit until the discrepancy is reconciled. |
| JSON / structured output | Yes | Yes | Both can return the scoring schema directly. |
| Reasoning behavior | Always thinks. Moonshot's card documents `low`, `high`, and `max`, while Together's launch page says max effort at launch. | Together exposes two effort levels but does not name the request values on its model page. | Neither is a true no-reasoning judge. Verify the controls on Together before spending and budget for max effort until proven otherwise. |
| Published scale | 2.8T total / 104B active MoE | ~750B total / 40B active MoE | Together's GLM page says 744B in its body and 753B in its specification, so false precision is unwarranted. Size alone is not judge quality evidence. |
| Candidate independence | Independent of DeepSeek V4 Flash, GPT-OSS 120B, Qwen3.5 9B, MiniMax M3, and Gemma 4 31B | Independent of the same five | Both pass the summarizer-independence test. |
| Corpus independence | Six guaranteed Moonshot/Kimi papers are in the corpus | No guaranteed Z.ai seed set | GLM must second-score all Kimi-authored papers to guard against lab self-favoring. |

Together's current [serverless catalog](https://docs.together.ai/docs/serverless/models) lists both models, their price triples, contexts, and structured-output support. Neither ID appears in the current [Together deprecation history](https://docs.together.ai/docs/deprecations). The authenticated `GET https://api.together.xyz/v1/models` response was independently checked on the retrieval date and returned the same price triples and live chat-model IDs.

## Quality evidence and its limits

There is no first-party benchmark that directly measures paper-summary judging accuracy. The closest current evidence comes from Moonshot's [Kimi K3 model card](https://huggingface.co/moonshotai/Kimi-K3), which reports both models under the same table and says its Kimi results use maximum reasoning effort:

- GPQA Diamond: Kimi 93.5 vs GLM 91.2.
- CritPt: Kimi 23.4 vs GLM 20.9.
- AA-LCR: Kimi 74.7 vs GLM 71.3.
- OfficeQA Pro: Kimi 63.3 vs GLM 41.4. This is the most document-adjacent comparison: the card says each task supplies an entire PDF corpus rendered as images.

These are provider-reported results from a Kimi source, not an independent judge benchmark, so they are directional rather than conclusive. Z.ai's [GLM 5.2 model card](https://huggingface.co/zai-org/GLM-5.2) supports GLM's strong reasoning credentials—91.2 GPQA Diamond and 40.5 HLE—but does not establish an advantage over Kimi for document evaluation. The human-calibrated two-judge pilot is therefore the actual selection test.

## Projected judge cost

The projection uses the real 50-paper extraction profile:

- 5,158,303 extracted characters across 50 papers;
- five candidate summaries per paper, or 250 judgments per judge;
- an explicit planning conversion of four characters per source token;
- 1,200 additional input tokens per judgment for the rubric, candidate summary, checklist/evidence instructions, and JSON schema; and
- a range of 500–2,000 billed completion tokens per judgment, including reasoning.

This gives approximately **6.75M input tokens** for one judge over the 50-paper/five-model pilot. The 1,000-paper number is a straight 20× extrapolation of the pilot's average document size; actual corpus tokenization must replace it before spending.

| One judge | 50 papers × five summaries | 1,000 papers × five summaries |
| --- | ---: | ---: |
| GLM 5.2 | **$10.00–$11.65** | **$199.94–$232.94** |
| Kimi K3 | **$22.12–$27.74** | **$442.37–$554.87** |

The range is output-sensitive because both models reason. It excludes retries and assumes standard uncached synchronous pricing. Repeating the same paper/rubric prefix for its five candidate summaries may create cached tokens, but cache hits must be measured from API usage rather than assumed in the budget.

The recommended second-judge policy costs roughly:

- **Full double-scored pilot:** an additional $10.00–$11.65 for GLM.
- **10% GLM audit of the full corpus:** about $20.00–$23.29, before extra triggered rows.

That is enough second-judge coverage to measure agreement without paying another $200–$233 to double-score every full-corpus judgment.

## Judge configuration and safeguards

1. Randomize candidates and replace model names with opaque IDs before judging.
2. Use the same strict JSON schema for both judges: five dimension scores, total score, confidence, and source evidence for every penalty.
3. Preflight `reasoning_effort="high"` on both endpoints. If Together rejects or ignores it, use the documented default/max behavior and label it. Keep the 15 human checklists out of judge prompts and use them afterward to audit scores and evidence; do not compare a max-effort judge against a high-effort judge without labeling the difference.
4. Set a completion ceiling high enough for reasoning plus evidence JSON, then count truncation as judge failure rather than silently retrying with a larger budget.
5. Store reasoning-token, cached-token, input-token, and output-token usage separately when Together returns them.
6. Use the lower 262,144 public GLM context limit. Any judgment exceeding it goes to Kimi and human review rather than truncating the paper invisibly.
7. Do not let either judge see provider names, prices, latency, or benchmark aggregates.
8. On Kimi-authored papers, treat GLM as the decisive machine judge if the two disagree; on future GLM-authored papers, reverse that rule.

## Why a second judge is necessary

A second judge is necessary to validate the benchmark, but not necessary on every one of the eventual 5,000 full-corpus judgments. There is no gold reference summary for 985 of the 1,000 papers, and both candidate judges are reasoning models with provider-specific biases. A fully double-scored pilot measures agreement against the 15 human checklists. A stratified full-run audit then detects drift and lab/topic bias at a manageable cost.

Publishing results from Kimi alone would make the quality ranking depend on one provider's preferences. Publishing a Kimi primary score plus GLM agreement rate, human-calibration agreement, disagreement count, and human resolutions is materially more defensible.

## Primary sources

- [Together serverless model catalog](https://docs.together.ai/docs/serverless/models)
- [Together deprecations](https://docs.together.ai/docs/deprecations)
- [Together Kimi K3 model page](https://www.together.ai/models/kimi-k3)
- [Together GLM 5.2 model page](https://www.together.ai/models/glm-52)
- [Moonshot Kimi K3 model card](https://huggingface.co/moonshotai/Kimi-K3)
- [Z.ai GLM 5.2 model card](https://huggingface.co/zai-org/GLM-5.2)
