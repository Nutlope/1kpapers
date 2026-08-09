import type { Metadata } from "next";
import { SITE_ORIGIN } from "../lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "The Year in AI Papers: Essential Research from 2025–2026",
    template: "%s | The Year in AI Papers",
  },
  description:
    "Read clear summaries of the most important AI papers from 2025–2026, organized by topic, research lab, citations, code, and publication date.",
  openGraph: {
    type: "website",
    siteName: "The Year in AI Papers",
    title: "The Year in AI Papers: Essential Research from 2025–2026",
    description: "Read clear summaries of the most important AI papers from 2025–2026, organized by topic, research lab, citations, code, and publication date.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Year in AI Papers: Essential Research from 2025–2026",
    description: "Read clear summaries of the most important AI papers from 2025–2026, organized by topic, research lab, citations, code, and publication date.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
