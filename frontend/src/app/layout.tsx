import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Superda — Video Format Analyzer & Downloader",
  description:
    "Paste a video URL to analyze all available formats, resolutions, codecs, and download options. Supports 1000+ sites.",
  keywords: ["video", "downloader", "format", "analyzer", "yt-dlp", "converter"],
  openGraph: {
    title: "Superda — Video Format Analyzer & Downloader",
    description: "Analyze and download video formats from any supported URL.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Ambient background glow */}
        <div className="fixed inset-0 bg-glow-top pointer-events-none z-0" />
        <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0 opacity-50" />

        {/* Main content */}
        <main className="relative z-10 min-h-screen">
          {children}
        </main>

        {/* Legal disclaimer */}
        <footer className="relative z-10 text-center py-6 text-xs text-zinc-700 border-t border-white/[0.03]">
          <p>
            Superda is a format analyzer for content you are authorized to download.
            <br />
            Please respect copyright laws and terms of service.
          </p>
        </footer>
      </body>
    </html>
  );
}
