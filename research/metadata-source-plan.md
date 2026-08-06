# Metadata source plan for 1,018 AI papers

## Scope and starting point

The collection contains 1,018 papers. Of these, 1,017 already have an arXiv ID and one supplemental Together AI paper, ParallelKernelBench, currently has an alphaXiv landing page but no arXiv ID in the manifest.

The enrichment should collect only the metadata that is useful for the planned paper site:

- official research lab attribution, with evidence
- official GitHub repository, with evidence and a current star count
- citation count
- DOI
- venue
- paper license

Every field must retain its source, retrieval time, matching method, and confidence. A missing fact is better than an unsupported guess.

## Implemented snapshot decision

The 2026-08-06 snapshot uses Semantic Scholar as the displayed citation source because three exact-ID batch requests matched 1,014 papers. Exact OpenAlex DOI lookups fill the three numeric arXiv misses. ParallelKernelBench remains without a citation count because it has no canonical scholarly identifier. DataCite supplies DOI and explicit rights metadata for all 1,017 arXiv papers. This implementation favors exact matching and fast reproducibility while retaining the broader source evaluation below for future refreshes.

## Recommended source order

1. Use the existing arXiv ID as the canonical lookup key.
2. Query arXiv by exact ID for canonical title, authors, dates, categories, optional journal DOI, journal reference, and author affiliations.
3. Query DataCite by the deterministic arXiv DOI, `10.48550/arxiv.{arxivId}`, for the arXiv DOI record and license.
4. Query OpenAlex by DOI for citation count, venue, license, and author institution candidates.
5. Query Crossref only when arXiv or OpenAlex provides a publisher DOI that is not the arXiv DOI.
6. Query Hugging Face Papers by exact arXiv ID for a GitHub repository candidate, project page, upvotes, and linked artifacts.
7. Extract GitHub URLs from the paper text and official lab page, then validate candidate repositories against GitHub.
8. Attribute official labs only from explicit first-party evidence or reviewed affiliation evidence.
9. Put unmatched or ambiguous records in a review queue. Do not silently accept fuzzy matches.

This sequence is inexpensive and practical for this corpus because 1,017 of 1,018 records have exact arXiv identifiers.

## Source evaluation

### arXiv

Use:

`GET https://export.arxiv.org/api/query?id_list={comma-separated-arxiv-ids}`

Best for:

- exact paper identity
- canonical title and ordered authors
- first submission date and latest version date
- abstract and arXiv categories
- optional author-supplied DOI and journal reference
- optional author affiliation strings

The API accepts a comma-delimited `id_list`. It returns Atom XML and includes optional `arxiv:doi`, `arxiv:journal_ref`, and `arxiv:affiliation` values. The published date is the first version date and the updated date is the retrieved version date. The API manual also documents a three-second delay between consecutive calls, while the API terms now require one connection and no more than one request every three seconds across all machines under the operator's control. Batch IDs so the entire corpus needs only a small number of requests. [arXiv API manual](https://info.arxiv.org/help/api/user-manual.html) [arXiv API terms](https://info.arxiv.org/help/api/tou.html)

Known gaps:

- no citation count
- no official lab field
- no official GitHub repository field
- DOI, journal reference, and affiliations are optional and author supplied
- the legacy Atom response does not expose a documented paper license field

Matching confidence:

- exact arXiv ID: `confirmed`
- title search without an ID: never needed for the 1,017 arXiv papers and should be `candidate` only

### DataCite

Use:

`GET https://api.datacite.org/dois/10.48550/arxiv.{arxivId}`

Best for:

- the DataCite DOI record for an arXiv paper
- paper license in `rightsList`
- title, creators, publication year, subjects, related identifiers, and resource type
- a secondary citation count when present

DataCite's public REST API requires no authentication for retrieval and returns the full DOI metadata record as JSON. Its response can include `rightsList` and `citationCount`. Identifying the client with a contact email raises the rate limit from 500 to 1,000 requests per five minutes per IP address. Authenticated access allows 3,000 requests per five minutes. A `429` means the client must back off. [DataCite REST API](https://support.datacite.org/docs/api) [single DOI lookup](https://support.datacite.org/docs/api-get-doi) [DataCite rate limits](https://support.datacite.org/docs/rate-limit)

For this corpus, identified public access can retrieve all 1,017 arXiv DOI records in roughly two five-minute windows without credentials. Cache responses and resume from a checkpoint.

Known gaps:

- a DataCite citation count is a DataCite count, not a universal citation count
- the arXiv record usually describes the preprint, not a later conference or journal publication
- `publisher: arXiv` is not the research lab and must never be used as lab attribution

Matching confidence:

- deterministic arXiv DOI with matching normalized title: `confirmed`
- DOI response with a conflicting title: `rejected` and sent to review

### OpenAlex

Use in this order:

1. `GET https://api.openalex.org/works/https://doi.org/{doi}`
2. For an arXiv paper with no publisher DOI, use `10.48550/arxiv.{arxivId}` as the DOI.
3. If DOI lookup fails, filter on both HTTP and HTTPS variants of the versionless arXiv landing URL.
4. Use title search only as a guarded final fallback.

Best for:

- primary citation count in `cited_by_count`
- citation history in `counts_by_year`
- OpenAlex work ID
- venue in `primary_location.source.display_name`
- license at the location level
- publication date
- author institutions and ROR identifiers in `authorships`

OpenAlex expects a free API key for use at scale. A free key includes $1 of API usage per day, while requests without a key have a $0.10 daily allowance. The current free-key allowance covers unlimited singleton entity lookups, 10,000 list and filter calls, or 1,000 search calls per day. Since DOI singleton retrieval is free, exact DOI lookups are preferable to title searches. OpenAlex returns `429` after the daily allowance is exhausted or when a client exceeds 100 requests per second. [OpenAlex overview](https://developers.openalex.org/) [OpenAlex authentication and pricing](https://developers.openalex.org/api-reference/authentication) [single work lookup](https://developers.openalex.org/api-reference/works/get-a-single-work)

Known gaps:

- OpenAlex has no paper-level official lab field
- author institutions are affiliation evidence, not proof that a paper is an official lab publication
- recent 2026 papers may have zero citations or incomplete venue metadata because indexing and citation accumulation take time
- citation counts are OpenAlex counts and should be labeled with `source: openalex` and `retrievedAt`
- location licenses can be missing even when DataCite has a rights statement

Matching confidence:

- exact DOI with matching normalized title: `confirmed`
- exact arXiv landing URL with matching title: `confirmed`
- normalized title plus publication year plus at least one matching author: `probable`
- title alone: `candidate`, never publish automatically

### Crossref

Use:

`GET https://api.crossref.org/v1/works/{publisher-doi}`

Best for:

- publisher DOI metadata
- venue in `container-title`
- publisher, record type, issued and published dates
- license links in `license[]`
- a secondary citation count in `is-referenced-by-count`

The public Crossref REST API requires no signup. Crossref recommends using an identifying `mailto` parameter or agent header for polite access. The documented rate values are 5 with concurrency 1 for the public pool, 10 with concurrency 3 for the polite pool, and 150 with no concurrency cap for Metadata Plus. The actual interval and pool information are returned in `x-rate-limit-limit`, `x-rate-limit-interval`, `x-concurrency-limit`, and `x-api-pool` response headers. Clients must cache results, handle `429`, and use backoff. [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) [Crossref access and authentication](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/) [Crossref usage guidance](https://www.crossref.org/documentation/retrieve-metadata/rest-api/tips-for-using-the-crossref-rest-api/)

Crossref should not be the first DOI source for this corpus. The `10.48550/arxiv.*` DOI records are registered with DataCite. Crossref becomes useful when arXiv supplies a separate journal or proceedings DOI.

Known gaps:

- deposits vary in completeness, so venue, license, affiliations, and dates can be absent
- `is-referenced-by-count` depends on deposited and matched Crossref references
- publisher is not the official research lab

Matching confidence:

- exact publisher DOI with matching title: `confirmed`
- bibliographic search result matching normalized title, year, type, and an author: `probable`
- first fuzzy result without those checks: `rejected`

### Hugging Face Papers

Use:

`GET https://huggingface.co/api/papers/{arxivId}`

or the official client method `HfApi.paper_info(arxivId)`.

Best for:

- GitHub repository candidate
- GitHub star snapshot supplied by Hugging Face
- project page
- Hugging Face upvotes
- linked models, datasets, and Spaces
- AI keywords

The exact lookup key is the arXiv ID. Public paper reads work anonymously, while the official clients accept a token. Hugging Face publishes API limits over fixed five-minute windows: 500 requests per IP for anonymous users, 1,000 for free authenticated users, and 2,500 for PRO users. Anonymous and free limits may vary with platform health. Read and honor `RateLimit`, `RateLimit-Policy`, and `429` responses. [Hugging Face paper API client](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api) [Hugging Face Papers CLI](https://huggingface.co/docs/huggingface_hub/en/guides/cli) [Hugging Face rate limits](https://huggingface.co/docs/hub/rate-limits)

Known gaps:

- no scholarly DOI, venue, license, or authoritative citation count
- no reliable official lab field
- Hugging Face upvotes are community popularity, not citations
- `githubRepo` is a useful candidate but must be verified before it is called official
- refresh stars from GitHub instead of publishing the cached Hugging Face value as current

Matching confidence:

- exact arXiv ID response: `confirmed` for the paper page
- returned GitHub repository: `candidate` until validated

### GitHub

Use:

- `GET https://api.github.com/repos/{owner}/{repo}` for repository metadata and `stargazers_count`
- `GET https://api.github.com/search/repositories?q={query}` only to discover candidates when first-party paper evidence has no repository
- the repository README or homepage to verify a backlink to the paper, arXiv ID, DOI, or official project page

The repository endpoint can read public repositories without authentication and returns `stargazers_count`. Authenticated REST requests normally receive 5,000 requests per hour, while unauthenticated public requests receive 60 per hour. Repository search has a separate, lower bucket. Use authentication, conditional requests, a queue, and response rate-limit headers. [GitHub repository endpoint](https://docs.github.com/en/rest/repos/repos#get-a-repository) [GitHub star fields](https://docs.github.com/en/rest/activity/starring) [GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) [GitHub API best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)

Do not list individual stargazers. Only retrieve `stargazers_count` from the repository object. This avoids an unnecessary endpoint and remains sufficient for the product.

Official repository evidence order:

1. The paper text explicitly labels a GitHub URL as code, implementation, or repository.
2. The official lab research or project page links the GitHub repository.
3. The repository README links back to the exact arXiv ID or DOI, and the owner is an allowlisted lab organization or a paper author.
4. Hugging Face Papers supplies the repository and the README links back to the exact paper.
5. GitHub search finds a title match without a paper backlink. This remains a `candidate` and is not published.

Repository confidence:

- paper or official lab page directly links the repo: `confirmed`
- exact paper backlink plus allowlisted lab organization ownership: `confirmed`
- exact paper backlink plus paper-author ownership: `probable`, unless the paper itself links it
- title similarity or stars alone: `candidate`
- fork or mirror without explicit paper evidence: `rejected`

Never choose a repository because it has more stars. A popular reimplementation is not necessarily the official implementation.

### ROR

Use:

`GET https://api.ror.org/v2/organizations?affiliation={encoded-affiliation}`

Best for:

- normalizing author affiliation strings to stable organization IDs
- canonical organization names
- mapping OpenAlex or Crossref affiliations into an allowlist of important AI labs

ROR requires no registration and allows up to 2,000 requests per five minutes per IP address. For unstructured affiliation matching, use the `affiliation` parameter and automatically accept only a result marked `chosen: true`. ROR explicitly warns that automated matching is imperfect and recommends human review as fallback. [ROR REST API](https://ror.readme.io/docs/rest-api) [ROR affiliation matching](https://ror.readme.io/docs/api-affiliation)

ROR does not prove that a paper is an official lab publication. It only normalizes an affiliation assertion. Preserve the original affiliation string and its source.

### Semantic Scholar as an optional citation cross-check

Semantic Scholar can look up an exact arXiv identifier such as `ARXIV:2106.15928`, return `citationCount`, venue, external IDs, and publication metadata, and batch multiple paper IDs. It is useful as an optional second citation source when OpenAlex has no record or when citation values need a cross-check. The introductory authenticated rate is one request per second, and unauthenticated requests share a public pool that can be throttled. [Semantic Scholar API](https://www.semanticscholar.org/product/api) [Semantic Scholar API tutorial](https://www.semanticscholar.org/product/api/tutorial)

Do not merge the Semantic Scholar and OpenAlex citation counts. Store them as separate source observations and choose OpenAlex as the displayed default unless the product explicitly changes that policy.

## Official lab attribution policy

Model lab attribution as a list because a paper can be coauthored across several labs:

```json
{
  "labs": [
    {
      "labId": "together-ai",
      "name": "Together AI",
      "rorId": null,
      "evidenceUrl": "https://www.together.ai/research",
      "evidenceType": "official-lab-research-page",
      "confidence": "confirmed"
    }
  ]
}
```

Evidence order:

1. Official lab research index or lab project page explicitly includes the paper: `confirmed`.
2. Official lab blog post explicitly describes the paper as the lab's research: `confirmed`.
3. Paper front matter contains the lab affiliation and ROR or exact allowlist normalization succeeds: `probable`.
4. OpenAlex authorship institution matches an allowlisted lab: `probable` and requires confirmation for a featured lab page.
5. An author works at the lab, but the paper does not list that affiliation: insufficient evidence.
6. A model family or lab name appears only in the paper body: insufficient evidence.

The current singular `officialLab` can be retained as a display convenience, but it should be derived from the structured `labs` array rather than used as the source of truth.

The allowlist should contain a stable internal lab ID, canonical display name, known aliases, ROR ID when one exists, official domains, official GitHub organizations, and research-index URLs. It should cover at least OpenAI, Anthropic, Google DeepMind, Meta AI, Microsoft Research, NVIDIA Research, xAI, DeepSeek, Moonshot AI, MiniMax, Zhipu AI or Z.ai, Qwen or Alibaba, Mistral AI, Cohere, AI2, Hugging Face, Together AI, and major academic labs selected for the site.

## Field-level source and conflict policy

| Field | Preferred source | Fallback | Conflict rule |
| --- | --- | --- | --- |
| `arxivId` | existing manifest and arXiv exact lookup | none | exact identifier wins |
| `doi` | arXiv publisher DOI, otherwise DataCite arXiv DOI | OpenAlex | preserve both `arxivDoi` and `publisherDoi` |
| `citationCount` | OpenAlex | Semantic Scholar, then Crossref or DataCite as separate observations | never average or sum counts |
| `venue` | Crossref publisher DOI record | OpenAlex primary source, then arXiv journal reference | prefer a published venue over arXiv |
| `license` | DataCite `rightsList` for arXiv version | Crossref or OpenAlex for publisher version | store license per version or location |
| `labs` | official lab page | paper affiliations normalized with ROR, then OpenAlex institutions | publish only confirmed lab pages automatically |
| `githubRepo` | paper or official lab page | Hugging Face candidate plus README backlink | never accept title or stars alone |
| `githubStars` | GitHub repository object | Hugging Face cached value | publish GitHub value with retrieval time |

## Provenance record

Each enriched field should carry an observation record instead of only a final scalar:

```json
{
  "value": 42,
  "source": "openalex",
  "sourceUrl": "https://api.openalex.org/works/W123",
  "retrievedAt": "2026-08-06T12:00:00Z",
  "matchedBy": "doi",
  "matchKey": "10.48550/arxiv.2509.08721",
  "confidence": "confirmed"
}
```

Use these confidence values consistently:

- `confirmed`: exact identifier or direct first-party evidence
- `probable`: several independent fields agree, but no exact first-party link exists
- `candidate`: plausible discovery result that requires review
- `rejected`: conflicting identity, fork, mirror, or unsupported inference

Store raw source snapshots or a content hash in a cache so the enrichment can be reproduced and audited without calling every API again.

## Practical collection passes

### Pass 1: exact scholarly metadata

Run one resumable job over all 1,018 papers:

- arXiv in batched exact-ID queries
- DataCite exact arXiv DOI requests
- OpenAlex exact DOI requests
- Crossref only for distinct publisher DOIs
- Semantic Scholar only for OpenAlex misses or selected citation cross-checks

Output one JSON record per paper and a coverage report for every target field.

### Pass 2: official repository discovery

Run in this order:

- Hugging Face exact paper lookup
- extract `github.com` URLs from existing PDF text
- inspect official lab research and project page links
- validate each candidate with GitHub repository metadata and README backlink
- collect `stargazers_count` only for accepted repositories

Search GitHub only for papers still missing a repository after these steps. Search results should enter review as candidates, not become published metadata.

### Pass 3: lab normalization

- maintain a reviewed lab allowlist
- match direct official-lab page evidence first
- normalize paper affiliation strings through ROR
- use OpenAlex institutions only as supplemental evidence
- manually review ambiguous big-lab matches and all featured paper entries

### Pass 4: quality report

Report:

- coverage by field and source
- exact, probable, candidate, rejected, and missing counts
- conflicts between citation sources
- unresolved DOI or venue mismatches
- repository candidates awaiting review
- featured labs with no confirmed papers
- retrieval timestamp and source version for every mutable metric

## Important gaps and non-goals

- No source provides a universal citation count. Display `OpenAlex citations` and a retrieval date.
- Google Scholar has no supported public API for this workflow. Do not scrape it.
- Web search volume for a paper title is not a stable or meaningful replacement for citations.
- Lab affiliation is often multi-valued and cannot safely be inferred from authors' current employers.
- Repository stars are mutable. Store `githubStarsRetrievedAt` and refresh periodically.
- A license can differ between the arXiv preprint and the publisher version. Store the version or source with the license.
- Venue metadata will be missing for preprints that were never published elsewhere.
- The one non-arXiv paper, ParallelKernelBench, needs a manual identity record or an OpenReview identifier before the generic exact-ID pipeline can enrich it reliably.
