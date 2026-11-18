
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyrisont | Rent what you need. Share what you have.",
  description:
    "A local peer-to-peer rental marketplace concept for Visby and Gotland. Find useful items or share what you own.",
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
