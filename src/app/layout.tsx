import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Campusly", template: "%s · Campusly" },
  description: "One place where admins, teachers, parents and students see the same record of attendance, marks and fees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
