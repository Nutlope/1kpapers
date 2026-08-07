import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "The Year in AI Papers",
    template: "%s | The Year in AI Papers",
  },
  description:
    "Explore 1,000 papers that defined the last year of artificial intelligence research.",
};

export const opengraphDefaults: Metadata["openGraph"] = {
  type: "website",
  siteName: "The Year in AI Papers",
};

export const twitterDefaults: Metadata["twitter"] = {
  card: "summary_large_image",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
