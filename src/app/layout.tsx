import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mumbai Megacity Monopoly",
  description: "Sab kuch milega. Guarantee nahi. A multiplayer Mumbai real-estate board game.",
  manifest: undefined,
};

export const viewport: Viewport = {
  themeColor: "#0B1729",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
