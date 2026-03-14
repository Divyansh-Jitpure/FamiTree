import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "FamiTree",
  description: "A multilingual family tree app for preserving people, memories, and relationships.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
