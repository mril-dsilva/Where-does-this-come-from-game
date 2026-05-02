import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { buildThemeBootstrapScript } from "@/lib/settings/game-settings.ts";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OriginGuessr by Mril",
  description:
    "OriginGuessr is a polished geography guessing game about tracing foods, inventions, and cultural items back to their country of origin.",
  applicationName: "OriginGuessr",
  creator: "MrillionAI",
  icons: {
    icon: "/og-favicon.svg",
  },
  keywords: [
    "geography game",
    "country guessing game",
    "Next.js portfolio project",
    "world globe",
    "country of origin",
    "OriginGuessr",
  ],
  openGraph: {
    title: "OriginGuessr by Mril",
    description:
      "OriginGuessr is a polished geography guessing game about tracing foods, inventions, and cultural items back to their country of origin.",
    type: "website",
    siteName: "OriginGuessr",
  },
  twitter: {
    card: "summary_large_image",
    title: "OriginGuessr by Mril",
    description:
      "OriginGuessr is a polished geography guessing game about tracing foods, inventions, and cultural items back to their country of origin.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]"
        suppressHydrationWarning
      >
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: buildThemeBootstrapScript() }}
        />
        {children}
      </body>
    </html>
  );
}
