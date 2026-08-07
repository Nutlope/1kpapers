import { paperAssetUrl } from "./public-storage";

const paperArtwork = {
  "arxiv-2512.02556": {
    cover: paperAssetUrl("arxiv-2512.02556", "cover"),
    social: paperAssetUrl("arxiv-2512.02556", "social"),
  },
  "arxiv-2602.02276": {
    cover: paperAssetUrl("arxiv-2602.02276", "cover"),
    social: paperAssetUrl("arxiv-2602.02276", "social"),
  },
  "arxiv-2511.21631": {
    cover: paperAssetUrl("arxiv-2511.21631", "cover"),
    social: paperAssetUrl("arxiv-2511.21631", "social"),
  },
  "arxiv-2508.10104": {
    cover: paperAssetUrl("arxiv-2508.10104", "cover"),
    social: null,
  },
  "arxiv-2511.16719": {
    cover: paperAssetUrl("arxiv-2511.16719", "cover"),
    social: null,
  },
  "arxiv-2602.15763": {
    cover: paperAssetUrl("arxiv-2602.15763", "cover"),
    social: null,
  },
  "arxiv-2510.18234": {
    cover: paperAssetUrl("arxiv-2510.18234", "cover"),
    social: null,
  },
  "arxiv-2607.24653": {
    cover: paperAssetUrl("arxiv-2607.24653", "cover"),
    social: null,
  },
  "arxiv-2509.04664": {
    cover: paperAssetUrl("arxiv-2509.04664", "cover"),
    social: null,
  },
} as const;

export function getPaperArtwork(paperId: string) {
  return paperArtwork[paperId as keyof typeof paperArtwork] ?? null;
}
