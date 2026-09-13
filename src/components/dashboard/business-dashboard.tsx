import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  DollarSign,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { buttonVariants } from "@/components/ui/button";
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

const metrics = [
  { label: "总收入", value: "$428.6K", change: "+12.4%", icon: DollarSign, tone: "indigo" },
  { label: "客户数量", value: "24,892", change: "+8.2%", icon: Users, tone: "blue" },
  { label: "转化率", value: "6.84%", change: "+1.1%", icon: TrendingUp, tone: "indigo" },
  { label: "平均订单金额", value: "$86.40", change: "+4.6%", icon: ShoppingCart, tone: "teal" },
] as const;

const channels = [
  { label: "直接访问", value: "$186.4K", percentage: "43.5%", width: "67%" },
  { label: "自然搜索", value: "$132.7K", percentage: "31.0%", width: "51%" },
  { label: "付费社交", value: "$68.3K", percentage: "15.9%", width: "30%" },
  { label: "合作伙伴", value: "$41.2K", percentage: "9.6%", width: "18%" },
] as const;

const activities = [
  { copy: <>收入较上一期增长 <strong>12.4%</strong>。</>, time: "2 小时前", icon: TrendingUp, tone: "teal" },
  { copy: <>本周新增客户达到 <strong>1,842</strong> 位。</>, time: "5 小时前", icon: UsersRound, tone: "indigo" },
  { copy: <>平均订单金额较上一期提升 <strong>4.6%</strong>。</>, time: "1 天前", icon: ShoppingCart, tone: "blue" },
] as const;

const toneClasses = {
  indigo: "bg-dashboard-indigo-soft text-dashboard-indigo",
  blue: "bg-dashboard-blue-soft text-blue-600",
  teal: "bg-dashboard-teal-soft text-dashboard-teal",
} as const;

function MetricCard({
  change,
  icon: Icon,
  label,
  tone,
  value,
}: (typeof metrics)[number]) {
  return (
    <Card className="gap-3 py-4 shadow-none [--card-spacing:--spacing(4)]">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardDescription>{label}</CardDescription>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", toneClasses[tone])}><Icon aria-hidden="true" className="size-4" strokeWidth={1.8} /></span>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-2xl @min-[510px]:text-[1.75rem] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="flex flex-wrap items-center gap-1 text-xs"><ArrowUpRight className="size-3.5 text-dashboard-teal" /><span className="font-medium text-dashboard-teal tabular-nums">{change}</span><span className="ml-1 text-muted-foreground">较上一期</span></p>
      </CardContent>
    </Card>
  );
}

function RevenuePanel() {
  return (
    <Card id="revenue-performance" className="min-w-0 shadow-none [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>收入趋势</CardTitle>
        <CardDescription>
          每月收入与上一期对比 · USD
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
    <Card id="channel-performance" className="shadow-none [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>渠道收入</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {channels.map((channel) => (
          <div className="flex flex-col gap-2" key={channel.label}>
            <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 text-sm">
              <span>{channel.label}</span>
              <strong className="font-semibold tabular-nums">{channel.value}</strong>
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
          查看近期动态
          <ChevronRight aria-hidden="true" className="size-4" />
        </a>
      </CardFooter>
    </Card>
  );
}

function ActivityPanel() {
  return (
    <Card id="recent-activity" className="shadow-none [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle>近期动态</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 @min-[950px]:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)]">
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
            <h2 className="font-semibold tabular-nums">业务摘要</h2>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            直接访问贡献了本期 43.5% 的收入，是目前最大的收入来源。
          </p>
          <a className={cn(buttonVariants({ variant: "link" }), "mt-4 px-0 text-dashboard-indigo")} href="#revenue-performance">
            查看收入趋势
            <ChevronRight aria-hidden="true" className="size-4" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessDashboard() {
  return (
    <AppShell active="overview">
      <main id="overview" className="@container min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
                业务概览
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                掌握核心指标，了解业务变化。
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-4" />
              <span className="tabular-nums">2026.01.01 – 2026.08.18</span>
              <span className="ml-1 rounded-md border bg-card px-2 py-1">示例数据</span>
            </div>
          </header>

          <section aria-label="Key performance indicators" className="grid gap-4 @min-[320px]:grid-cols-2 @min-[800px]:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} {...metric} />
            ))}
          </section>

          <section aria-label="Performance analysis" className="grid min-w-0 gap-5 @min-[800px]:grid-cols-[minmax(0,1.8fr)_minmax(250px,1fr)]">
            <RevenuePanel />
            <ChannelPanel />
          </section>

          <ActivityPanel />
        </div>
      </main>
    </AppShell>
  );
}
