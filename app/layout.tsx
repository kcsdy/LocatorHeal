import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LocatorHeal — Auto-heal locators from your GitHub repo",
  description:
    "Connect a GitHub repo, scan POM pages, auto-heal locators, and generate safe patches or pull requests.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
