export const MAX_PAPER_SLUG_LENGTH = 80;

export type SluggablePaper = {
  id: string;
  title: string;
  slug?: string;
};

export function slugifyPaperTitle(title: string, maxLength = MAX_PAPER_SLUG_LENGTH) {
  if (!Number.isSafeInteger(maxLength) || maxLength < 8) {
    throw new Error("Paper slug maxLength must be an integer of at least 8");
  }

  const normalized = title
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .replace(/[’']/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "paper";

  return truncateSlug(normalized, maxLength);
}

export function buildPaperSlugMap(papers: readonly SluggablePaper[]) {
  const candidates = papers.map((paper) => ({
    paper,
    stored: validStoredSlug(paper.slug),
    base: validStoredSlug(paper.slug) ?? slugifyPaperTitle(paper.title),
  }));
  const result = new Map<string, string>();
  const allocated = new Set<string>();

  for (const candidate of candidates.filter(({ stored }) => stored).sort(byPaperId)) {
    if (allocated.has(candidate.base)) {
      throw new Error(`Stored paper slug is not unique: ${candidate.base}`);
    }
    allocated.add(candidate.base);
    result.set(candidate.paper.id, candidate.base);
  }

  const generated = candidates.filter(({ stored }) => !stored);
  const groups = new Map<string, typeof generated>();
  for (const candidate of generated) {
    const group = groups.get(candidate.base) ?? [];
    group.push(candidate);
    groups.set(candidate.base, group);
  }

  for (const [, group] of [...groups].sort(([left], [right]) => left.localeCompare(right))) {
    if (group.length === 1 && !allocated.has(group[0]!.base)) {
      const candidate = group[0]!;
      allocated.add(candidate.base);
      result.set(candidate.paper.id, candidate.base);
      continue;
    }

    for (const candidate of [...group].sort(byPaperId)) {
      result.set(candidate.paper.id, allocateUnique(candidate.base, candidate.paper.id, allocated, true));
    }
  }
  return result;
}

function byPaperId(left: { paper: SluggablePaper }, right: { paper: SluggablePaper }) {
  return left.paper.id.localeCompare(right.paper.id);
}

export function paperPublicSlug(paper: Pick<SluggablePaper, "title" | "slug">) {
  return validStoredSlug(paper.slug) ?? slugifyPaperTitle(paper.title);
}

export function paperHref(paper: Pick<SluggablePaper, "title" | "slug">) {
  return `/papers/${paperPublicSlug(paper)}`;
}

function validStoredSlug(slug: string | undefined) {
  if (!slug || slug.length > MAX_PAPER_SLUG_LENGTH || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return undefined;
  }
  return slug;
}

function allocateUnique(base: string, id: string, allocated: Set<string>, forceSuffix = false) {
  if (!forceSuffix && !allocated.has(base)) {
    allocated.add(base);
    return base;
  }

  for (let attempt = 0; ; attempt += 1) {
    const suffix = shortHash(attempt === 0 ? id : `${id}-${attempt}`);
    const candidate = `${truncateSlug(base, MAX_PAPER_SLUG_LENGTH - suffix.length - 1)}-${suffix}`;
    if (!allocated.has(candidate)) {
      allocated.add(candidate);
      return candidate;
    }
  }
}

function truncateSlug(slug: string, maxLength: number) {
  if (slug.length <= maxLength) return slug;
  const hardCut = slug.slice(0, maxLength).replace(/-+$/g, "");
  const wordCut = hardCut.slice(0, hardCut.lastIndexOf("-"));
  return wordCut.length >= Math.floor(maxLength * 0.6) ? wordCut : hardCut;
}

function shortHash(value: string) {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(7, "0").slice(0, 7);
}
