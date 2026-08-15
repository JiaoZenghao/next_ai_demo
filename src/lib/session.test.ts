import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  delete: vi.fn(),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "./auth";
import { createDemoSession, deleteDemoSession } from "./session";

describe("demo session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a secure server-side demo session cookie", async () => {
    await createDemoSession();

    expect(cookieStore.set).toHaveBeenCalledWith(
      DEMO_SESSION_COOKIE,
      DEMO_SESSION_VALUE,
      {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        path: "/",
        maxAge: 24 * 60 * 60,
      },
    );
  });

  it("deletes the demo session cookie", async () => {
    await deleteDemoSession();

    expect(cookieStore.delete).toHaveBeenCalledWith(DEMO_SESSION_COOKIE);
  });
});
