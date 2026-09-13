// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevenueChart } from "./revenue-chart";

describe("RevenueChart", () => {
  it("renders the responsive shadcn chart with an accessible summary and legend", () => {
    const { container } = render(<RevenueChart />);

    expect(
      screen.getByRole("application", {
        name: "Revenue from January to August 2026",
      }),
    ).toHaveAccessibleDescription(
      /peak of seventy-eight thousand four hundred dollars in July/i,
    );
    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
    expect(screen.getByText("本期收入")).toBeInTheDocument();
    expect(screen.getByText("上一期")).toBeInTheDocument();
    expect(screen.getByText("$78.4K")).toBeInTheDocument();
  });
});
