import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OverUnder — Odds Divergence Scanner",
  description:
    "Compare a market's implied probability across Polymarket, Kalshi and a sportsbook line, and see why the venues disagree.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
