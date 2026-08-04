# A reproducible 1,000-paper frontier-AI corpus

Snapshot date: 2026-08-04  
Inclusion window: 2025-08-04 through 2026-08-04 (UTC)

## Recommendation

Use a hybrid corpus: **every verified official public arXiv paper in the seed set for OpenAI, Anthropic, DeepSeek, MiniMax, and Moonshot AI / Kimi, then the most-upvoted papers from Hugging Face Daily Papers until the corpus reaches 1,000**. Enforce the date window using each paper's arXiv v1 publication date, and resolve every paper and PDF through its arXiv identifier. Do not call it every important AI paper or every paper published by frontier labs.

This gives the project a coherent, reproducible story while remaining broad across language models, agents, reasoning, vision, multimodal generation, systems, robotics, and scientific AI.

## Live inventory

The frozen build returned **8,262 unique discovery candidates** after the initial Hugging Face publication-date filter. The highest-ranked paper had 665 upvotes. Mandatory official papers can fall below the natural popularity cutoff.

All final 1,000 version-pinned arXiv PDF URLs returned HTTP 200 with `application/pdf`. One candidate (`2606.14066v4`) returned 404, and one older paper resurfaced in Daily Papers despite falling outside the arXiv v1 window; both were replaced from a 50-paper reserve before model calls.

Approximate, non-exclusive keyword coverage within the top 1,000 (title plus abstract/summary):

- LLMs, agents, and reasoning: 766
- Vision, multimodal work, and generation: 521
- AI systems and efficiency: 378
- Robotics and embodied AI: 104
- AI for science and medicine: 92

These are descriptive keyword checks, not a final taxonomy.

## Lab coverage

Track, but do not conflate, two different relationships:

1. `official_lab`: the paper was authored or officially published by the lab.
2. `model_families_mentioned`: the paper studies, evaluates, or compares one of the lab's models.

Initial lab set:

- OpenAI
- Anthropic
- Google DeepMind / Google
- Meta AI / FAIR
- DeepSeek
- Alibaba / Qwen
- Moonshot AI / Kimi
- MiniMax
- Z.ai / Zhipu / GLM
- Mistral AI
- xAI
- NVIDIA

Affiliation cannot be inferred reliably from a model name appearing in a title or abstract. Official-lab attribution needs evidence from the paper, an official lab publication page, or an official repository/model card.

The frozen seed set contains 30 official arXiv papers: OpenAI 7, Anthropic 5, DeepSeek 8, MiniMax 4, and Moonshot AI / Kimi 6. The audit also found 12 first-party PDF-only technical reports from OpenAI and Anthropic. They are documented in [`official-lab-paper-seeds.md`](./official-lab-paper-seeds.md) but excluded from this arXiv-only corpus so every row follows the same stable identifier and version-pinning rule.

## Selection rule

1. Fetch Daily Papers candidates using monthly pagination, then enforce the fixed date window against arXiv's v1 publication timestamp.
2. Deduplicate on canonical arXiv ID without the version suffix.
3. Insert every first-party-evidenced official-lab seed.
4. Sort the remaining pool by Hugging Face `upvotes`, using arXiv ID as a stable tie-breaker, and create a 1,050-paper candidate set.
5. Resolve version-pinned arXiv landing-page and PDF URLs.
6. Verify HTTP status and PDF content type; replace inaccessible community papers from the reserve and fail if an official seed is inaccessible.
7. Freeze exactly 1,000 unique verified papers before running models.

The public wording should be **"1,000 popular papers that defined a year of AI, with guaranteed official research from five frontier labs."** Upvotes are a community-popularity signal, not a proof of scientific importance.

## Manifest fields

Each row should contain:

- `rank`
- `arxiv_id` and `arxiv_version`
- `title`, `authors`, `abstract`
- `published_at` and `submitted_on_daily_at`
- `hf_upvotes` and `hf_snapshot_at`
- `arxiv_categories`
- `landing_url` and version-pinned `pdf_url`
- `pdf_http_status`, `pdf_content_type`, `pdf_sha256`, `pdf_bytes`
- `page_count`, `extracted_characters`, and extraction warnings
- `official_lab` plus `official_lab_evidence_url`
- `model_families_mentioned`
- `topic_tags`
- `license`

PDFs should remain runtime downloads and should not be committed.

## Biases and limitations

- Hugging Face upvotes reflect one technical community and can be gamed.
- Upvotes can change, so the manifest must freeze the count and timestamp.
- Newer papers have had less time to accumulate votes, although Daily Papers attention is often concentrated near publication.
- Lab marketing posts without a public paper are outside this PDF corpus.
- arXiv date, Daily Papers submission date, and a paper's first public release date are not always identical.
- A top-1,000 popularity corpus will not give equal representation to every lab. Lab balance should be reported, not retroactively manufactured while still calling the result the top 1,000.

## Sources

- [Hugging Face `list_daily_papers` API documentation](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api#huggingface_hub.HfApi.list_daily_papers)
- [Hugging Face papers CLI documentation](https://huggingface.co/docs/huggingface_hub/main/en/guides/cli#hf-papers)
- [arXiv API access documentation](https://info.arxiv.org/help/api/index.html)

The project should include arXiv's requested acknowledgment: "Thank you to arXiv for use of its open access interoperability."

## Benchmark sequence after the manifest is frozen

1. Run a stratified 50-paper pilot across all candidate models.
2. Calibrate factuality and coverage judges against a human-reviewed subset.
3. Select finalists using quality, completion rate, latency, and cost.
4. Run the 1,000-paper corpus only with the finalists.

The headline's dollar amount must come from the completed run. Do not pre-commit to "$2".
