import type { Metadata } from "next";
import Link from "next/link";
import { ChartNoAxesCombined } from "lucide-react";
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
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `(function(){try{document.documentElement.classList.toggle('dark',localStorage.getItem('lumina-theme')==='dark')}catch(e){}})()` }} />
      </head>
      {/* Extensions such as Grammarly inject body attributes before hydration. */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <header aria-label="应用工具栏" className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-dashboard-indigo text-white dark:text-background"><ChartNoAxesCombined className="size-4" /></span>Lumina<span className="ml-3 hidden border-l pl-3 text-xs font-normal tracking-normal text-muted-foreground sm:block">数据分析工作台</span></Link>
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
