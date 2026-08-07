import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import {
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

export const TIGRIS_BUCKET = "year-in-ai-papers";
export const TIGRIS_PUBLIC_BASE_URL = "https://year-in-ai-papers.t3.tigrisfiles.io";

export type ImageKind = "cover" | "social" | "topic";

type Environment = Record<string, string | undefined>;

export function imageObjectKey(kind: ImageKind, id: string, extension = ".png") {
  const safeId = assertSafeObjectSegment(id, "image ID");
  const safeExtension = extension.toLowerCase();
  if (!/^\.(?:avif|jpe?g|png|webp)$/.test(safeExtension)) {
    throw new Error(`Unsupported image extension: ${extension}`);
  }

  if (kind === "topic") return `topics/${safeId}/art${safeExtension}`;
  return `papers/${safeId}/${kind}${safeExtension}`;
}

export function paperSummaryObjectKey(paperId: string) {
  return `papers/${assertSafeObjectSegment(paperId, "paper ID")}/summary.json`;
}

export function publicObjectUrl(key: string, baseUrl = TIGRIS_PUBLIC_BASE_URL) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl.replace(/\/$/, "")}/${encodedKey}`;
}

export function gzipJson(value: unknown) {
  const json = Buffer.from(`${JSON.stringify(value)}\n`);
  return { body: gzipSync(json), json };
}

export function tigrisClientConfig(env: Environment = process.env): S3ClientConfig {
  const accessKeyId = env.TIGRIS_STORAGE_ACCESS_KEY_ID ?? env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.TIGRIS_STORAGE_SECRET_ACCESS_KEY ?? env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing Tigris credentials. Set TIGRIS_STORAGE_ACCESS_KEY_ID and TIGRIS_STORAGE_SECRET_ACCESS_KEY.",
    );
  }

  return {
    endpoint: env.TIGRIS_STORAGE_ENDPOINT ?? env.AWS_ENDPOINT_URL_S3 ?? "https://t3.storage.dev",
    region: env.AWS_REGION ?? "auto",
    credentials: { accessKeyId, secretAccessKey },
  };
}

export function createTigrisClient(env: Environment = process.env) {
  return new S3Client(tigrisClientConfig(env));
}

export async function ensurePublicReadCors(client: S3Client) {
  await client.send(new PutBucketCorsCommand({
    Bucket: TIGRIS_BUCKET,
    CORSConfiguration: {
      CORSRules: [{
        AllowedMethods: ["GET", "HEAD"],
        AllowedOrigins: ["*"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["Content-Encoding", "Content-Length", "Content-Type", "ETag"],
        MaxAgeSeconds: 3_600,
      }],
    },
  }));
}

export async function uploadObject(
  client: S3Client,
  input: {
    key: string;
    body: Uint8Array;
    contentType: string;
    contentEncoding?: string;
    cacheControl: string;
  },
) {
  const sha256 = createHash("sha256").update(input.body).digest("hex");
  await client.send(new PutObjectCommand({
    Bucket: TIGRIS_BUCKET,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
    ...(input.contentEncoding ? { ContentEncoding: input.contentEncoding } : {}),
    CacheControl: input.cacheControl,
    Metadata: { sha256 },
  }));

  const head = await client.send(new HeadObjectCommand({
    Bucket: TIGRIS_BUCKET,
    Key: input.key,
  }));
  if (head.ContentLength !== input.body.byteLength || head.Metadata?.sha256 !== sha256) {
    throw new Error(`Remote verification failed for ${input.key}`);
  }

  return {
    key: input.key,
    url: publicObjectUrl(input.key),
    bytes: input.body.byteLength,
    sha256,
  };
}

export function imageContentType(extension: string) {
  switch (extension.toLowerCase()) {
    case ".avif": return "image/avif";
    case ".jpeg":
    case ".jpg": return "image/jpeg";
    case ".png": return "image/png";
    case ".webp": return "image/webp";
    default: throw new Error(`Unsupported image extension: ${extension}`);
  }
}

function assertSafeObjectSegment(value: string, label: string) {
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  return value;
}
