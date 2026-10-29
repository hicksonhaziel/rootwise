import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rootwise — Every wrong answer has a root.",
  description:
    "An open-source misconception finder for university courses. Rootwise reads your answer, finds the belief that produced it, and proves the fix stuck.",
  keywords: ["study", "learning", "misconception", "AI tutor", "university", "Nigeria"],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Rootwise",
    description: "Every wrong answer has a root. Rootwise digs it up.",
    type: "website",
    images: [{ url: "/icon.png" }],
  },
};

import { ThemeProvider } from "@/components/theme/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('rootwise-theme');var d=true;if(s==='light')d=false;else if(s==='dark')d=true;else d=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.add(d?'dark':'light');}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className="bg-bg-base text-text-primary antialiased min-h-screen transition-colors duration-200"
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
