import { serializeJsonLd } from "../lib/paper-structured-data";

export function JsonLd({ value }: { value: unknown }) {
  return <script type="application/ld+json">{serializeJsonLd(value)}</script>;
}
