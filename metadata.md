# Metadata for the 1,018-paper collection

Snapshot target: 2026-08-06

## Goal

Build one website-ready metadata dataset for the frozen 1,000-paper benchmark corpus plus the 18 supplemental Together AI papers. The metadata work must not change the benchmark corpus, benchmark results, costs, or headline numbers.

The collection contains exactly 1,018 unique paper records with no overlap between the two source sets. There are 1,017 canonical arXiv IDs. ParallelKernelBench is the one non-arXiv record and uses its existing stable collection ID and alphaXiv source URLs.

## What already exists

| Field | Core 1,000 | Together 18 | Decision |
|---|---:|---:|---|
| Title | 1,000 | 18 | Keep |
| Authors | 1,000 | 0 | Fill the 18 missing records |
| Abstract | 1,000 | 0 | Fill the 18 missing records |
| Published date | 1,000 | 0 | Fill the 18 missing records |
| arXiv categories | 1,000 | 0 | Fill the 18 missing records when available |
| Topic tags | 968 | 0 | Reuse the current classifier to fill gaps |
| Hugging Face upvotes | 1,000 | 0 | Keep as the frozen popularity signal |
| Official lab | 30 | 18 | Expand only with evidence |
| Citation count | 0 | 0 | Add with a frozen timestamp |
| Official GitHub repository | 0 | 0 | Add only when the paper-to-repository relationship is supported |
| GitHub stars | 0 | 0 | Add from GitHub with a frozen timestamp |
| DOI | 0 | 0 | Add when supplied by a scholarly metadata source |
| Venue | 0 | 0 | Add when supplied by a scholarly metadata source |
| License | 0 | 0 | Add only when explicit |

## Required website fields

Every record must contain these keys. Unknown values use `null` or an empty array. Missing data must never be guessed.

### Stable identity and existing content

- `collectionId`: `arxiv-{canonical arXiv ID}` or the existing stable non-arXiv ID
- `arxivId`: canonical ID or `null` for ParallelKernelBench
- `arxivVersion`
- `title`
- `authors`
- `abstract`
- `publishedAt`
- `updatedAt`
- `landingUrl`
- `pdfUrl`
- `sourceCollection`: `benchmark-1000` or `together-research-18`
- `benchmarkRank`: number for the core corpus, otherwise `null`
- `topicTags`
- `arxivCategories`
- `hfUpvotes`
- `summary`: the completed summary already generated for that paper
- `summaryModel`
- `summaryMethodologyVersion`
- `summaryGeneratedAt`

The local completed summary set currently uses GPT Luna for the core 1,000 papers and DeepSeek V4 Flash for the 18 supplemental Together AI papers. The model must be explicit on every record.

### Official lab

- `officialLab`: canonical display name or `null`
- `officialLabEvidenceUrl`: URL supporting the attribution or `null`
- `officialLabSource`: one of `curated-seed`, `together-research`, `official-repository`, `huggingface-organization`, `manual`, or `null`
- `officialLabConfidence`: `verified`, `strong`, or `unknown`

The initial display allowlist is:

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
- Together AI

Attribution priority:

1. Existing first-party lab publication page or official repository evidence.
2. Together AI Research listing for the supplemental papers.
3. A repository owned by a mapped official lab organization that directly names or links the paper.
4. A Hugging Face paper organization matching the curated lab allowlist.
5. Otherwise `null`.

A model name in a title or abstract is not evidence of lab authorship.

### Citations

- `citationCount`
- `citationSource`: `semantic-scholar` or `null`
- `citationSnapshotAt`
- `semanticScholarPaperId`

Citation counts are time-dependent. The value is only meaningful with its source and retrieval timestamp. Zero is valid only when the source returns zero. A failed match uses `null`.

### Official or author-provided code

- `githubRepository`: canonical `https://github.com/{owner}/{repository}` URL or `null`
- `githubStars`: integer or `null`
- `githubStarsSnapshotAt`
- `githubRepositorySource`: `official-lab`, `author-project`, `huggingface-paper`, `manual`, or `null`
- `githubRepositoryEvidenceUrl`
- `githubRepositoryConfidence`: `verified`, `strong`, `candidate`, or `unknown`

Repository acceptance rules:

1. The repository must exist and be public.
2. The repository README, description, homepage, citation file, or release notes must identify the paper by arXiv ID, exact title, or paper landing page.
3. `verified` means an official lab organization owns the repository and the repository identifies the paper.
4. `strong` means the repository identifies the paper and is presented as its project or implementation repository, but ownership is not a curated lab organization.
5. An unverified Hugging Face suggestion remains `candidate` and must not be labeled official in the interface.
6. Community reproductions are excluded from `githubRepository`. They may be added later as a separate field if the product needs them.

GitHub is the authority for `githubStars`. Hugging Face star values may help discovery but are not the final stored count.

### Publication details

- `doi`
- `venue`
- `license`
- `publicationMetadataSource`

These fields are useful but lower priority than lab, citations, and code. Keep them `null` when no authoritative source supplies them. Do not convert general arXiv access into a Creative Commons license.

## Source strategy

| Need | Primary route | Fallback | Matching rule |
|---|---|---|---|
| Citations | Semantic Scholar Academic Graph batch API | OpenAlex, only for missing records | Exact canonical arXiv ID; reviewed title and source match for ParallelKernelBench |
| DOI and venue | Semantic Scholar exact arXiv match | DataCite arXiv DOI and exact OpenAlex DOI fallback | Exact arXiv ID, then exact DOI |
| License | DataCite exact arXiv DOI rights record | Crossref or OpenAlex explicit license | Never infer |
| Repository candidate | Hugging Face paper record | Existing curated lab evidence | Exact arXiv ID |
| Repository validation | GitHub repository metadata and contents | Manual review queue | Paper ID, title, or landing URL evidence |
| GitHub stars | GitHub repository API | None | Exact owner and repository |
| Official lab | Existing curated evidence | Curated Hugging Face organization mapping | Allowlisted organization only |
| Missing Together basics | Semantic Scholar exact arXiv match | arXiv API | Exact canonical arXiv ID |

## Output files

- `data/papers.sqlite`: canonical editable records for all 1,018 papers; the local copy is gitignored and the published copy lives in Tigris
- `metadata/papers.json`: legacy generated review snapshot, not a publishing source
- `metadata/report.json`: completeness counts, unresolved records, and source snapshots
- `metadata/raw/semantic-scholar.json`: reproducible scholarly lookup snapshot
- `metadata/raw/publication.json`: DataCite DOI and license snapshot plus exact OpenAlex fallbacks
- `metadata/raw/hugging-face.json`: paper organization and repository discovery snapshot
- `metadata/raw/github.json`: validated repository and star snapshot
- `metadata/manual.json`: reviewed first-party metadata for records without a canonical scholarly identifier

Raw snapshots must not contain API keys or authorization headers.

## Validation gates

- Exactly 1,018 unique records, 1,017 unique canonical arXiv IDs, and one stable non-arXiv record.
- No benchmark corpus or benchmark result file changes.
- Every non-null citation count has a source and snapshot timestamp.
- Every non-null GitHub star count has a repository and snapshot timestamp.
- Every non-null official lab has an evidence URL and confidence value.
- Every accepted repository resolves on GitHub and contains paper relationship evidence.
- No repository candidate is silently upgraded to official.
- No secret values appear in generated snapshots.
- Missing values remain explicit and are counted in `metadata/report.json`.

## Intentionally ignored for now

- Web search volume for a paper title
- Social media mentions
- Researcher count beyond the existing author list
- Custom thumbnails
- Generated popularity scores
- Composite importance rankings
- Community reproduction repositories
- Translated implementations
- Live citation or star updates on every page request

These can be added later without blocking the first site. Citation and star counts should be refreshed through a scheduled snapshot job, not fetched during page rendering.
