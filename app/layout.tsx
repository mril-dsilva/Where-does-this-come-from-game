import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
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
  title: "OriginGuessr | MrillionAI",
  description:
    "OriginGuessr is a polished geography guessing game about tracing foods, inventions, and cultural items back to their country of origin.",
  applicationName: "OriginGuessr",
  creator: "MrillionAI",
  keywords: [
    "geography game",
    "country guessing game",
    "Next.js portfolio project",
    "world globe",
    "country of origin",
    "OriginGuessr",
  ],
  openGraph: {
    title: "OriginGuessr | MrillionAI",
    description:
      "OriginGuessr is a polished geography guessing game about tracing foods, inventions, and cultural items back to their country of origin.",
    type: "website",
    siteName: "OriginGuessr",
  },
  twitter: {
    card: "summary_large_image",
    title: "OriginGuessr | MrillionAI",
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
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
