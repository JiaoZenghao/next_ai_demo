import {
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";

import { logoutAction } from "@/app/actions/logout";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Overview", href: "#overview", icon: LayoutDashboard, active: true },
  { label: "Analytics", href: "#revenue-performance", icon: ChartNoAxesColumnIncreasing },
  { label: "Reports", href: "#channel-performance", icon: FileText },
  { label: "Customers", href: "#recent-activity", icon: UsersRound },
];

const metrics = [
  { label: "Revenue", value: "$428.6K", change: "+12.4%", icon: DollarSign, tone: "indigo" },
  { label: "Customers", value: "24,892", change: "+8.2%", icon: Users, tone: "blue" },
  { label: "Conversion", value: "6.84%", change: "+1.1%", icon: TrendingUp, tone: "indigo" },
  { label: "Avg. order", value: "$86.40", change: "+4.6%", icon: ShoppingCart, tone: "teal" },
] as const;

const channels = [
  { label: "Direct", value: "$186.4K", percentage: "43.5%", width: "67%" },
  { label: "Organic search", value: "$132.7K", percentage: "31.0%", width: "51%" },
  { label: "Paid social", value: "$68.3K", percentage: "15.9%", width: "30%" },
  { label: "Partners", value: "$41.2K", percentage: "9.6%", width: "18%" },
] as const;

const activities = [
  { copy: <>Revenue increased <strong>12.4%</strong> compared to the previous period.</>, time: "2h ago", icon: TrendingUp, tone: "teal" },
  { copy: <>Customer sign-ups reached <strong>1,842</strong> this week.</>, time: "5h ago", icon: UsersRound, tone: "indigo" },
  { copy: <>Average order value improved <strong>4.6%</strong> vs last period.</>, time: "1d ago", icon: ShoppingCart, tone: "blue" },
] as const;

const toneClasses = {
  indigo: "bg-dashboard-indigo-soft text-dashboard-indigo",
  blue: "bg-dashboard-blue-soft text-blue-600",
  teal: "bg-dashboard-teal-soft text-dashboard-teal",
} as const;

function Brand() {
  return (
    <a className="inline-flex items-center gap-3 text-dashboard-sidebar-foreground" href="#overview">
      <span className="flex size-9 items-center justify-center text-indigo-300">
        <Sparkles aria-hidden="true" className="size-8" strokeWidth={1.7} />
      </span>
      <span className="text-[1.375rem] font-semibold tracking-tight">Lumina</span>
    </a>
  );
}

function LogoutButton({ mobile = false }: { mobile?: boolean }) {
  return (
    <form action={logoutAction}>
      <Button
        className={cn(mobile ? undefined : "w-full justify-start")}
        type="submit"
        variant={mobile ? "outline" : "ghost"}
      >
        <LogOut data-icon="inline-start" />
        Log out
      </Button>
    </form>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] flex-col bg-dashboard-sidebar px-3 py-10 text-dashboard-sidebar-foreground lg:flex">
      <div className="px-2">
        <Brand />
      </div>
      <nav aria-label="Main navigation" className="mt-10 flex flex-col gap-2">
        {navigationItems.map(({ active, href, icon: Icon, label }) => (
          <a
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[52px] items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-dashboard-sidebar-active text-white"
                : "text-dashboard-sidebar-foreground/75 hover:bg-white/8 hover:text-white",
            )}
            href={href}
            key={label}
          >
            <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
            {label}
          </a>
        ))}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <LogoutButton />
      </div>
    </aside>
  );
}

function MobileHeader() {
  return (
    <header className="flex items-center justify-between bg-dashboard-sidebar px-4 py-3 lg:hidden">
      <Brand />
      <LogoutButton mobile />
    </header>
  );
}

function MetricCard({
  change,
  icon: Icon,
  label,
  tone,
  value,
}: (typeof metrics)[number]) {
  return (
    <Card className="min-h-36 justify-center gap-3 py-5 shadow-sm [--card-spacing:--spacing(5)]">
      <CardHeader className="grid grid-cols-[auto_1fr] items-center gap-4">
        <span className={cn("flex size-14 items-center justify-center rounded-full", toneClasses[tone])}>
          <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <CardDescription className="truncate">{label}</CardDescription>
          <CardTitle className="mt-1 text-[1.75rem] font-semibold tracking-tight">{value}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pl-[6.25rem]">
        <p className="inline-flex items-center gap-1 text-sm font-semibold text-dashboard-teal">
          <ArrowUpRight aria-hidden="true" className="size-4" />
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

function RevenuePanel() {
  return (
    <Card id="revenue-performance" className="min-w-0 shadow-sm [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Revenue performance</CardTitle>
        <CardDescription>
          Monthly revenue compared with the previous period
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <RevenueChart />
      </CardContent>
    </Card>
  );
}

function ChannelPanel() {
  return (
    <Card id="channel-performance" className="shadow-sm [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Revenue by channel</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {channels.map((channel) => (
          <div className="flex flex-col gap-2" key={channel.label}>
            <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 text-sm">
              <span>{channel.label}</span>
              <strong className="font-semibold">{channel.value}</strong>
              <span className="w-10 text-right text-xs text-muted-foreground">{channel.percentage}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                aria-hidden="true"
                className="h-full rounded-full bg-dashboard-indigo"
                style={{ width: channel.width }}
              />
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter className="border-0 bg-transparent pt-0">
        <a className={cn(buttonVariants({ variant: "link" }), "px-0 text-dashboard-indigo")} href="#recent-activity">
          View full report
          <ChevronRight aria-hidden="true" className="size-4" />
        </a>
      </CardFooter>
    </Card>
  );
}

function ActivityPanel() {
  return (
    <Card id="recent-activity" className="shadow-sm [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 @min-[950px]:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)]">
        <div className="flex flex-col">
          {activities.map(({ copy, icon: Icon, time, tone }, index) => (
            <div key={time}>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className={cn("flex size-10 items-center justify-center rounded-full", toneClasses[tone])}>
                  <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.8} />
                </span>
                <p className="text-sm leading-6 text-muted-foreground [&_strong]:font-semibold [&_strong]:text-dashboard-indigo">
                  {copy}
                </p>
                <time className="text-xs text-muted-foreground">{time}</time>
              </div>
              {index < activities.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
        <div className="border-t pt-5 @min-[950px]:border-t-0 @min-[950px]:border-l @min-[950px]:pt-0 @min-[950px]:pl-7">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-dashboard-indigo-soft text-dashboard-indigo">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <h2 className="font-semibold">Insight</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Direct traffic continues to drive the most revenue, contributing
            43.5% of total sales this period.
          </p>
          <a className={cn(buttonVariants({ variant: "link" }), "mt-4 px-0 text-dashboard-indigo")} href="#revenue-performance">
            Explore analytics
            <ChevronRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessDashboard() {
  return (
    <div className="dashboard-theme min-h-[calc(100dvh-3.5rem)] bg-dashboard-canvas lg:grid lg:grid-cols-[216px_minmax(0,1fr)]">
      <Sidebar />
      <MobileHeader />
      <main id="overview" className="@container min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
          <header className="flex flex-col gap-5 @min-[780px]:flex-row @min-[780px]:items-start @min-[780px]:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-[2.625rem]">
                Business Overview
              </h1>
              <p className="mt-2 text-sm text-foreground/70 sm:text-base">
                Track performance across your entire business.
              </p>
            </div>
            <details className="group relative self-start">
              <summary className="flex h-12 min-w-60 cursor-pointer list-none items-center justify-center gap-3 rounded-lg border bg-background px-4 text-sm font-medium shadow-xs outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                <CalendarDays aria-hidden="true" className="size-4" />
                <span>Jan 1 – Aug 18, 2026</span>
                <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
                Mock data through August 18, 2026
              </div>
            </details>
          </header>

          <section aria-label="Key performance indicators" className="grid gap-4 @min-[510px]:grid-cols-2 @min-[1100px]:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <section aria-label="Performance analysis" className="grid min-w-0 gap-5 @min-[950px]:grid-cols-[minmax(0,1.85fr)_minmax(310px,0.95fr)]">
            <RevenuePanel />
            <ChannelPanel />
          </section>

          <ActivityPanel />
        </div>
      </main>
    </div>
  );
}
