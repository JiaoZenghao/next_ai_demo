import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, ChartNoAxesColumnIncreasing, LayoutDashboard, LogOut, Settings, Activity } from "lucide-react";
import { logoutAction } from "@/app/actions/logout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children, active }: { children: ReactNode; active: "overview" | "settings" }) {
  return (
    <div className="dashboard-theme min-h-[calc(100dvh-3.5rem)] bg-dashboard-canvas lg:grid lg:grid-cols-[192px_minmax(0,1fr)]">
      <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] flex-col border-r bg-card px-3 py-6 lg:flex">
        <p className="mb-3 px-3 text-xs font-medium text-muted-foreground">工作空间</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {[{ href: "/", label: "业务概览", icon: LayoutDashboard, current: active === "overview" },
            { href: "/#revenue-performance", label: "收入趋势", icon: ChartNoAxesColumnIncreasing, current: false },
            { href: "/#channel-performance", label: "渠道表现", icon: BarChart3, current: false },
            { href: "/#recent-activity", label: "近期动态", icon: Activity, current: false },
          ].map(({ href, label, icon: Icon, current }) => (
            <Link key={label} href={href} aria-current={current ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-muted", current ? "bg-dashboard-indigo-soft font-medium text-dashboard-indigo" : "text-muted-foreground")}><Icon className="size-4" />{label}</Link>
          ))}
          <div className="my-4 border-t" />
          <Link href="/settings" aria-current={active === "settings" ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-muted", active === "settings" ? "bg-dashboard-indigo-soft font-medium text-dashboard-indigo" : "text-muted-foreground")}><Settings className="size-4" />模型配置</Link>
        </nav>
        <form action={logoutAction} className="mt-auto border-t pt-3"><Button variant="ghost" className="w-full justify-start text-muted-foreground" type="submit"><LogOut className="size-4" />退出登录</Button></form>
      </aside>
      <div className="min-w-0">
        <nav aria-label="移动端导航" className="flex items-center gap-1 border-b bg-card px-4 py-2 lg:hidden">
          <Link href="/" aria-current={active === "overview" ? "page" : undefined} className={cn("rounded-md px-3 py-2 text-sm", active === "overview" ? "bg-dashboard-indigo-soft font-medium text-dashboard-indigo" : "text-muted-foreground")}>业务概览</Link>
          <Link href="/settings" aria-current={active === "settings" ? "page" : undefined} className={cn("rounded-md px-3 py-2 text-sm", active === "settings" ? "bg-dashboard-indigo-soft font-medium text-dashboard-indigo" : "text-muted-foreground")}>模型配置</Link>
          <form action={logoutAction} className="ml-auto"><Button variant="ghost" size="icon" aria-label="退出登录" type="submit"><LogOut className="size-4" /></Button></form>
        </nav>
        {children}
      </div>
    </div>
  );
}
