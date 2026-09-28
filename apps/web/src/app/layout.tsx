import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});
// Only the AiOps logo uses Inter (its lettering is set in Inter 750).
const logoFont = Inter({ subsets: ["latin"], variable: "--font-logo" });

export const metadata: Metadata = {
  title: "AiOps",
  description: "AiOps, your DevOps agent. Powered By Zosa Agentic.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${logoFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
