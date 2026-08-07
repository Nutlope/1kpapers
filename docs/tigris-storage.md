# Public site storage

The site reads generated images and JSON from the public `year-in-ai-papers`
Tigris bucket:

```text
data/papers.sqlite
papers/{paperId}/cover.png
papers/{paperId}/social.png
papers/{paperId}/summary.json
topics/{topicId}/art.png
summaries.json
catalog.json
homepage.json
most-cited.json
most-starred.json
search-index.json
```

`data/papers.sqlite` is the canonical editable dataset. The local copy at
`data/papers.sqlite` is gitignored. Every JSON object below it is generated
from that database for fast static-site delivery.

JSON objects are uploaded with gzip compression and `Content-Encoding: gzip`.
Paper and topic IDs make replacement uploads overwrite the existing public key.
`catalog.json` is the compact browse payload, while `homepage.json` contains
precomputed featured, trending, top-three most-cited, topic, and month data.
`most-cited.json` contains the complete top-100 ranking and is only fetched by
the citation ranking page. `most-starred.json` does the same for linked GitHub
repositories, so the starred ranking page does not fetch the full catalog. Full
abstracts and summaries stay in the per-paper objects; `summaries.json` remains
as a legacy compatibility export and is not fetched by the site.

## Sync summary data

```sh
pnpm data:pull
# Edit data/papers.sqlite with sqlite3 or a SQLite GUI.
pnpm storage:sync
```

`storage:sync` republishes all derived JSON and paper objects, verifies them,
then uploads the canonical SQLite database last.

To bootstrap the database once from the legacy JSON snapshot:

```sh
pnpm data:import-json
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

The legacy `metadata/papers.json` file remains a generated review snapshot; it
is not the publishing source of truth.
