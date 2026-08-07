const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const SITE_ORIGIN = configuredSiteUrl.replace(/\/$/, "");

export function absoluteSiteUrl(path = "/") {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}
