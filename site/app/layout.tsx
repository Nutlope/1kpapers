import type { Metadata } from "next";
import Script from "next/script";
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
      {/* Privacy-friendly analytics by Plausible */}
      <Script src="https://plausible.io/js/pa-oJgWqfiD0t8P20lE1gXif.js" strategy="afterInteractive" />
      <Script id="plausible-init" strategy="afterInteractive">
        {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
      </Script>
    </html>
  );
}
