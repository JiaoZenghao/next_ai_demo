import { afterEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { loadAIConfig } from "./load-config";

vi.mock("server-only", () => ({}));
vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, readFileSync: vi.fn(actual.readFileSync) };
});
afterEach(() => vi.mocked(readFileSync).mockReset());

it("loads the shipped configuration with mock as the safe default", () => {
  expect(loadAIConfig()).toMatchObject({ mode: "mock", assignments: { "data-assistant": "local-bi" } });
});
it("does not expose filesystem diagnostics when config is missing", () => {
  vi.mocked(readFileSync).mockImplementation(() => { throw new Error("sensitive path"); });
  expect(() => loadAIConfig()).toThrow("Unable to read config/ai.yaml.");
});
