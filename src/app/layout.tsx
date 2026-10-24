import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Brand fonts (D-013 "Evergreen"), self-hosted by Next at build time. Tokens in globals.css use the variables.
const body = Nunito_Sans({ subsets: ["latin", "latin-ext"], variable: "--f-nunito" });
const display = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--f-fraunces" });

export const metadata: Metadata = {
  title: { default: "Campusly", template: "%s · Campusly" },
  description: "One place where admins, teachers, parents and students see the same record of attendance, marks and fees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
