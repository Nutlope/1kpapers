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
    const response = await fetch(source.pdfUrl, {
      headers: { "User-Agent": "smartpdfs-bench/0.1 (reproducible research)" },
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`Download failed (${response.status}) for ${source.pdfUrl}`);
    }
    bytes = new Uint8Array(await response.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      throw new Error(`Downloaded file is not a PDF: ${source.pdfUrl}`);
    }
    await writeFile(pdfPath, bytes);
  }

  const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
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

export function chunkText(text: string) {
  if (!text.length) return [];
  const chunkSize = Math.min(
    MAX_CHUNK_CHARACTERS,
    Math.ceil(text.length / 4),
  );
  const chunks: string[] = [];
  for (let offset = 0; offset < text.length; offset += chunkSize) {
    chunks.push(text.slice(offset, offset + chunkSize));
  }
  return chunks;
}
