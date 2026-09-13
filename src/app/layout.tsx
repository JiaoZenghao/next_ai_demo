import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeToggle } from "@/components/theme-toggle";
import "@copilotkit/react-ui/styles.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "AI Demo",
    template: "%s | AI Demo",
  },
  description: "A Next.js application for exploring agentic AI development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `(function(){try{document.documentElement.classList.toggle('dark',localStorage.getItem('lumina-theme')==='dark')}catch(e){}})()` }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header aria-label="Appearance" className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-end gap-3 border-b bg-background px-4 sm:px-6">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
