import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "../lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
  };
}
