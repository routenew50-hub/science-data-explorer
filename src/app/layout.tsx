import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Somatic Science Data Explorer",
  description: "Global Science Data & Research Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
