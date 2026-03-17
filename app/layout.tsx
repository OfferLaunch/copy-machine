import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copy Machine | OfferLaunch",
  description: "AI-powered sales copy generator for high-ticket offers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
