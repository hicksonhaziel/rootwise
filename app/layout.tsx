import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rootwise — Every wrong answer has a root.",
  description:
    "An open-source misconception finder for university courses. Rootwise reads your answer, finds the belief that produced it, and proves the fix stuck.",
  keywords: ["study", "learning", "misconception", "AI tutor", "university", "Nigeria"],
  openGraph: {
    title: "Rootwise",
    description: "Every wrong answer has a root. Rootwise digs it up.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-bg-base text-text-primary antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
