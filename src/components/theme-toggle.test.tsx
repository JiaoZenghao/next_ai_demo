// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});
afterEach(() => vi.restoreAllMocks());

it("switches both directions and persists the choice", () => {
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole("button", { name: "切换深浅主题" }));
  expect(document.documentElement).toHaveClass("dark");
  expect(localStorage.getItem("lumina-theme")).toBe("dark");
  fireEvent.click(screen.getByRole("button", { name: "切换深浅主题" }));
  expect(document.documentElement).not.toHaveClass("dark");
  expect(localStorage.getItem("lumina-theme")).toBe("light");
});

it("restores the saved theme on mount", () => {
  localStorage.setItem("lumina-theme", "dark");
  render(<ThemeToggle />);
  expect(document.documentElement).toHaveClass("dark");
});

it("still switches when browser storage is blocked", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole("button", { name: "切换深浅主题" }));
  expect(document.documentElement).toHaveClass("dark");
});
