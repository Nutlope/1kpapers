import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { DocumentInfo, Source } from "./types.js";

export const CACHE_DIR = path.resolve(".cache/pdfs");
export const MAX_CHUNK_CHARACTERS = 50_000;

export async function prepareDocument(source: Source): Promise<DocumentInfo> {
  await mkdir(CACHE_DIR, { recursive: true });
  const pdfPath = path.join(CACHE_DIR, `${source.id}.pdf`);
  let bytes: Uint8Array;
  try {
    bytes = await readFile(pdfPath);
  } catch {
    const response = await fetchPdf(source.pdfUrl);
    bytes = new Uint8Array(await response.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      throw new Error(`Downloaded file is not a PDF: ${source.pdfUrl}`);
    }
    await writeFile(pdfPath, bytes);
  }

  // Some otherwise-readable research PDFs contain malformed embedded-font
  // instructions. Keep pdf.js at error-only verbosity so those recoverable
  // warnings do not flood benchmark logs.
  const pdf = await getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise;
  let fullText = "";
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let pageText = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5] ?? null;
      if (lastY !== null && y !== null && lastY !== y) {
        pageText += "\n";
        if (lastY - y > 12) pageText += "\n";
      }
      pageText += item.str;
      lastY = y;
    }
    fullText += `${pageText}\n\n`;
  }
  fullText = sanitizeExtractedText(fullText);

  return {
    ...source,
    path: pdfPath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.byteLength,
    pages: pdf.numPages,
    characters: fullText.length,
    chunks: chunkText(fullText),
  };
}

export function sanitizeExtractedText(text: string) {
  let sanitized = "";
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(index + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        sanitized += text.charAt(index) + text.charAt(index + 1);
        index += 1;
      } else {
        sanitized += "�";
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      sanitized += "�";
    } else {
      sanitized += text.charAt(index);
    }
  }
  return sanitized;
}

async function fetchPdf(url: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "year-in-ai-papers/0.1 (reproducible research)" },
        redirect: "follow",
        signal: AbortSignal.timeout(60_000),
      });
      if (response.ok) return response;
      if (response.status !== 429 && response.status < 500)
        throw new PermanentDownloadError(
          `Download failed (${response.status}) for ${url}`,
        );
      lastError = new Error(`Transient download failure (${response.status}) for ${url}`);
    } catch (error) {
      if (error instanceof PermanentDownloadError) throw error;
      lastError = error;
    }
    if (attempt < 3)
      await new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** (attempt - 1)));
  }
  throw lastError;
}

class PermanentDownloadError extends Error {}

export function chunkText(text: string) {
  if (!text.length) return [];
  const chunks: string[] = [];
  for (let offset = 0; offset < text.length; ) {
    let end = Math.min(text.length, offset + MAX_CHUNK_CHARACTERS);
    const lastCode = text.charCodeAt(end - 1);
    const nextCode = text.charCodeAt(end);
    if (
      end < text.length &&
      lastCode >= 0xd800 &&
      lastCode <= 0xdbff &&
      nextCode >= 0xdc00 &&
      nextCode <= 0xdfff
    ) {
      end += 1;
    }
    chunks.push(text.slice(offset, end));
    offset = end;
  }
  return chunks;
}
