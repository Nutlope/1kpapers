# Summary quality and reliability evaluation

## Principle

Quality, operational reliability, latency, and cost are separate axes. A malformed, timed-out, or missing summary is a reliability failure and cannot quietly disappear from the quality denominator.

## Pilot

Run every candidate summarizer on the frozen 50-paper pilot. The pilot includes all mandatory official-lab seeds and explicit coverage of LLM/reasoning, vision/multimodal, systems, robotics, and scientific/medical AI. Download and extraction profiles must be checked before model calls so the pilot includes short, medium, long, and extraction-difficult PDFs.

## Human calibration set

Select 15 pilot papers spanning labs, topics, and document sizes. A human reviewer records:

- the paper's central question;
- the main method or contribution;
- the strongest stated result, including important numbers;
- material limitations and scope conditions; and
- claims that would be misleading if stated without qualification.

This checklist is the calibration reference. The abstract alone is not a sufficient gold summary.

## Blind judge

Randomize candidate order and remove model names and prices. Use two strong judge models from providers that are independent of the candidate when possible. Each judge sees the source text, the human checklist when available, and one candidate summary.

Score each completed summary from 0–100:

| Dimension | Weight | Question |
| --- | ---: | --- |
| Factual coverage | 35 | Does it capture the central question, contribution, major results, and limitations? |
| Faithfulness | 30 | Are claims supported by the paper, with no invented result or unjustified certainty? |
| Importance | 20 | Does it prioritize the paper's substantive contribution over incidental detail? |
| Numerical fidelity | 10 | Are material values, comparisons, and directions correct? |
| Clarity | 5 | Is the result concise and understandable without distorting the work? |

Judges must quote or identify source evidence for every unsupported-claim penalty. Judge disagreements of 20 points or more go to human review.

## Deterministic checks

- schema parses and required fields are present;
- title is not copied from an unrelated chunk;
- all numbers in the summary can be located in the source text;
- output length remains within the published limit;
- empty, truncated, refusal, and timeout outputs are classified consistently; and
- token counts and prices are provider-reported rather than estimated when available.

## Reliability and performance report

For every model report:

- completion rate and successful summaries / attempted papers;
- timeouts, refusals, malformed outputs, and retries by type;
- p50 and p95 end-to-end latency;
- input/output tokens and total inference cost;
- cost per attempted paper and cost per successful paper;
- mean quality on the fixed pilot, with failures retained in the completion denominator; and
- judge cost separately from summarization cost.

The full 1,000-paper run begins only after the pilot identifies finalists with acceptable quality and completion rate.

