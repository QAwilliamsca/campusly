import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

// Brand fonts (D-013 "Evergreen"), self-hosted by Next at build time. Tokens in globals.css use the variables.
const body = Nunito_Sans({ subsets: ["latin", "latin-ext"], variable: "--f-nunito" });
const display = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--f-fraunces" });

// Runs before first paint so the page never flashes the wrong theme: saved choice, else the OS setting.
// A fixed string (no user input), so inlining it is safe.
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme")}catch(e){}if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;`;

export const metadata: Metadata = {
  title: { default: "Campusly", template: "%s · Campusly" },
  description: "One place where admins, teachers, parents and students see the same record of attendance, marks and fees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: data-theme is set by THEME_SCRIPT before React hydrates.
    <html lang="en" className={`${body.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
