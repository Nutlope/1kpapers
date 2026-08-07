# Public site storage

The site reads generated images and JSON from the public `year-in-ai-papers`
Tigris bucket:

```text
papers/{paperId}/cover.png
papers/{paperId}/social.png
papers/{paperId}/summary.json
topics/{topicId}/art.png
summaries.json
catalog.json
homepage.json
search-index.json
```

JSON objects are uploaded with gzip compression and `Content-Encoding: gzip`.
Paper and topic IDs make replacement uploads overwrite the existing public key.
`catalog.json` is the compact browse payload, while `homepage.json` contains
precomputed featured, trending, most-cited, topic, and month data. Full
abstracts and summaries stay in the per-paper objects; `summaries.json` remains
as a legacy compatibility export and is not fetched by the site.

## Sync summary data

```sh
pnpm storage:sync
```

## Replace one image

```sh
pnpm storage:sync -- \
  --kind cover \
  --id arxiv-2607.24653 \
  --file path/to/new-cover.png
```

Valid image kinds are `cover`, `social`, and `topic`. For topic art, pass the
topic slug as `--id`.

## Update one paper summary

After updating `metadata/papers.json`, this uploads that paper record with its
precomputed related papers and also refreshes the catalog, homepage, legacy,
and search indexes:

```sh
pnpm storage:sync -- \
  --paper-id arxiv-2607.24653
```
