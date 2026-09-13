// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { DataAssistant } from "./data-assistant";

const capture = vi.hoisted(() => ({ sidebar: {} as { instructions: string; suggestions: { message: string }[] }, runtimeUrl: "" }));
vi.mock("@copilotkit/react-core", () => ({
  CopilotKit: ({ children, runtimeUrl }: { children: ReactNode; runtimeUrl: string }) => { capture.runtimeUrl = runtimeUrl; return children; },
  useCopilotReadable: vi.fn(), useCopilotAction: vi.fn(),
}));
vi.mock("@copilotkit/react-core/v2", () => ({ useCopilotKit: () => ({ copilotkit: { runtimeConnectionStatus: "connected" } }) }));
vi.mock("@copilotkit/react-ui", () => ({ CopilotSidebar: (props: typeof capture.sidebar & { children: ReactNode; labels: { initial: string } }) => {
  capture.sidebar = props;
  return <><p>{props.labels.initial}</p>{props.children}</>;
} }));
vi.mock("./revenue-chart", () => ({ RevenueChart: () => null }));

it("uses the live model for questions without asking it to replay a mock answer", () => {
  render(<DataAssistant mode="live"><div>Independent dashboard</div></DataAssistant>);
  expect(capture.runtimeUrl).toBe("/api/copilotkit");
  expect(capture.sidebar.suggestions[0].message).not.toMatch(/mock|演示/);
  expect(capture.sidebar.instructions).toContain("general questions");
  expect(capture.sidebar.instructions).not.toContain("Use only the provided dashboard mock data");
  expect(screen.getByText("Independent dashboard")).toBeVisible();
});
it("keeps the scripted assistant in demo mode", () => {
  render(<DataAssistant mode="mock"><div>Independent dashboard</div></DataAssistant>);
  expect(capture.sidebar.suggestions[0].message).toContain("演示");
  expect(screen.getByText(/不调用模型/)).toBeVisible();
  expect(screen.getByText("Independent dashboard")).toBeVisible();
});
