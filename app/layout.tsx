import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Year in AI Papers",
    template: "%s | The Year in AI Papers",
  },
  description:
    "Explore 1,000 papers that defined the last year of artificial intelligence research.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
