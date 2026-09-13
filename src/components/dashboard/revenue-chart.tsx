"use client";

import { useId } from "react";
import { revenueData, type RevenuePoint } from "@/data/revenue";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--dashboard-indigo)",
  },
  previousPeriod: {
    label: "Previous period",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatAxisValue(value: number) {
  return value === 0 ? "$0" : `$${value / 1000}K`;
}

export function RevenueChart({ data = revenueData }: { data?: RevenuePoint[] }) {
  const id = useId().replace(/:/g, "");
  const descriptionId = `revenue-description-${id}`;
  const gradientId = `revenue-gradient-${id}`;
  return (
    <div>
      <p className="sr-only" id={descriptionId}>
        Revenue rises from forty-six thousand dollars in January to a peak of
        seventy-eight thousand four hundred dollars in July, remaining above
        the previous period every month.
      </p>
      <ChartContainer
        className="h-[300px] w-full aspect-auto sm:h-[340px]"
        config={chartConfig}
        initialDimension={{ width: 720, height: 340 }}
      >
        <AreaChart
          accessibilityLayer
          aria-describedby={descriptionId}
          aria-label="Revenue from January to August 2026"
          data={data}
          desc="Revenue rises from forty-six thousand dollars in January to a peak of seventy-eight thousand four hundred dollars in July, remaining above the previous period every month."
          margin={{ top: 32, right: 16, bottom: 4, left: 0 }}
          title="Revenue from January to August 2026"
        >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-revenue)"
              stopOpacity={0.36}
            />
            <stop
              offset="95%"
              stopColor="var(--color-revenue)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 5" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="month"
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          axisLine={false}
          domain={[0, 100000]}
          tickFormatter={formatAxisValue}
          tickLine={false}
          ticks={[0, 20000, 40000, 60000, 80000, 100000]}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex min-w-40 items-center justify-between gap-6">
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-foreground">
                    {currencyFormatter.format(Number(value))}
                  </span>
                </div>
              )}
              indicator="line"
            />
          }
          cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
        />
        <ReferenceLine
          stroke="var(--color-revenue)"
          strokeDasharray="3 5"
          strokeOpacity={0.25}
          x="Jul"
        />
        <Area
          isAnimationActive={false}
          activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--card)" }}
          dataKey="previousPeriod"
          dot={false}
          fill="transparent"
          stroke="var(--color-previousPeriod)"
          strokeDasharray="7 7"
          strokeOpacity={0.52}
          strokeWidth={2}
          type="natural"
        />
        <Area
          isAnimationActive={false}
          activeDot={{ r: 6, strokeWidth: 3, stroke: "var(--card)" }}
          dataKey="revenue"
          dot={false}
          fill={`url(#${gradientId})`}
          fillOpacity={1}
          stroke="var(--color-revenue)"
          strokeWidth={3}
          type="natural"
        />
        {data.some(point => point.month === "Jul") && <ReferenceDot
          fill="var(--color-revenue)"
          label={{
            value: "$78.4K",
            position: "top",
            fill: "var(--color-revenue)",
            fontSize: 12,
            fontWeight: 700,
          }}
          r={5}
          stroke="var(--card)"
          strokeWidth={3}
          x="Jul"
          y={78400}
        />}
        <ChartLegend
          content={
            <ChartLegendContent className="justify-start gap-5 px-2 pt-5" />
          }
        />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
