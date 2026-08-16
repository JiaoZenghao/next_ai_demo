import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieGetMock, cookiesMock, redirectMock } = vi.hoisted(() => {
  const cookieGetMock = vi.fn();

  return {
    cookieGetMock,
    cookiesMock: vi.fn(async () => ({ get: cookieGetMock })),
    redirectMock: vi.fn(() => {
      throw new Error("NEXT_REDIRECT");
    }),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { getDemoSession, verifySession } from "./auth";
import { DEMO_SESSION_VALUE } from "@/lib/auth";

describe("demo authentication DAL", () => {
  beforeEach(() => {
    cookieGetMock.mockReset();
    cookiesMock.mockClear();
    redirectMock.mockClear();
  });

  it("returns the minimal session for the exact demo cookie", async () => {
    cookieGetMock.mockReturnValue({ value: DEMO_SESSION_VALUE });

    await expect(getDemoSession()).resolves.toEqual({ isAuthenticated: true });
  });

  it.each([undefined, { value: "" }, { value: "forged" }])(
    "rejects a missing or invalid cookie %#",
    async (cookie) => {
      cookieGetMock.mockReturnValue(cookie);

      await expect(getDemoSession()).resolves.toBeNull();
    },
  );

  it("returns the verified session", async () => {
    cookieGetMock.mockReturnValue({ value: DEMO_SESSION_VALUE });

    await expect(verifySession()).resolves.toEqual({ isAuthenticated: true });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects an invalid session to login", async () => {
    cookieGetMock.mockReturnValue(undefined);

    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
