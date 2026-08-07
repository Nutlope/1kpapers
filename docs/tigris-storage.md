# Public site storage

The site reads generated images and JSON from the public `year-in-ai-papers`
Tigris bucket:

```text
papers/{paperId}/cover.png
papers/{paperId}/social.png
papers/{paperId}/summary.json
topics/{topicId}/art.png
summaries.json
search-index.json
```

JSON objects are uploaded with gzip compression and `Content-Encoding: gzip`.
Paper and topic IDs make replacement uploads overwrite the existing public key.

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

After updating `metadata/papers.json`, this uploads that paper record and also
refreshes the global summaries and search index:

```sh
pnpm storage:sync -- \
  --paper-id arxiv-2607.24653
```
