// @vitest-environment jsdom
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import RootLayout from "./layout";
vi.mock("next/font/local", () => ({ default: () => ({ variable: "test-font" }) }));
vi.mock("@/components/theme-toggle", () => ({ ThemeToggle: () => <button>Theme</button> }));

it("hydrates when a browser extension adds attributes to body", async () => {
  const element = <RootLayout><main>Page content</main></RootLayout>;
  const html = renderToString(element);
  document.open();
  document.write(`<!DOCTYPE html>${html}`);
  document.close();
  document.body.setAttribute("data-new-gr-c-s-check-loaded", "14.1328.0");
  document.body.setAttribute("data-gr-ext-installed", "");
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => { root = hydrateRoot(document, element); });
    expect(document.body.textContent).toContain("Page content");
    expect(errors.mock.calls.flat().join(" ")).not.toMatch(/hydrated|hydration|didn't match/i);
  } finally {
    await act(async () => root?.unmount());
    errors.mockRestore();
  }
});
