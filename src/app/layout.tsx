import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CookbookAI",
  description: "Import recipes from the web and adapt them to your kitchen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
