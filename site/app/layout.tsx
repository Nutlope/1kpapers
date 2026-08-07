import type { Metadata } from "next";
import { SITE_ORIGIN } from "../lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "The Year in AI Papers",
    template: "%s | The Year in AI Papers",
  },
  description:
    "Explore more than 1,000 papers in a curated atlas of artificial intelligence research.",
  openGraph: {
    type: "website",
    siteName: "The Year in AI Papers",
    title: "The Year in AI Papers",
    description: "Explore more than 1,000 papers in a curated atlas of artificial intelligence research.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Year in AI Papers",
    description: "Explore more than 1,000 papers in a curated atlas of artificial intelligence research.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
