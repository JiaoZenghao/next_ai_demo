export const revenueData = [
  { month: "Jan", revenue: 46000, previousPeriod: 34500 },
  { month: "Feb", revenue: 56400, previousPeriod: 38200 },
  { month: "Mar", revenue: 60200, previousPeriod: 46100 },
  { month: "Apr", revenue: 49800, previousPeriod: 34200 },
  { month: "May", revenue: 66400, previousPeriod: 50100 },
  { month: "Jun", revenue: 71200, previousPeriod: 53400 },
  { month: "Jul", revenue: 78400, previousPeriod: 61800 },
  { month: "Aug", revenue: 73100, previousPeriod: 50400 },
];

export type RevenuePoint = (typeof revenueData)[number];
