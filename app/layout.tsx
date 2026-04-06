import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Where does this come from? | Mrillion",
  description:
    "A minimal geography guessing game about tracing foods, inventions, and brands back to their country of origin.",
  keywords: [
    "geography game",
    "country guessing game",
    "Next.js portfolio project",
    "world globe",
    "country of origin",
  ],
  openGraph: {
    title: "Where does this come from? | Mrillion",
    description:
      "A minimal geography guessing game about tracing foods, inventions, and brands back to their country of origin.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Where does this come from? | Mrillion",
    description:
      "A minimal geography guessing game about tracing foods, inventions, and brands back to their country of origin.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
