import { describe, expect, it } from "vitest";

import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_VALUE,
  getAuthRedirect,
  validateCredentials,
} from "./auth";

describe("validateCredentials", () => {
  it("accepts the exact demo credentials", () => {
    expect(validateCredentials("admin", "admin123")).toBe(true);
  });

  it.each([
    ["Admin", "admin123"],
    ["admin", "Admin123"],
    ["admin", "wrong"],
    ["wrong", "admin123"],
    ["", "admin123"],
    ["admin", ""],
    [null, "admin123"],
    ["admin", null],
  ])("rejects invalid credentials %#", (username, password) => {
    expect(validateCredentials(username, password)).toBe(false);
  });
});

describe("getAuthRedirect", () => {
  it.each(["/api/health/live", "/api/health/ready"])("allows unauthenticated probe %s", pathname => {
    expect(getAuthRedirect(pathname, false)).toBeNull();
  });
  it.each(["/api/health", "/api/health/ready/extra", "/api/health/live-admin", "/api/copilotkit"])("does not widen the public probe exemption to %s", pathname => {
    expect(getAuthRedirect(pathname, false)).toBe("/login");
  });
  it("allows an unauthenticated request for the login page", () => {
    expect(getAuthRedirect("/login", false)).toBeNull();
  });

  it("redirects an authenticated login-page request home", () => {
    expect(getAuthRedirect("/login", true)).toBe("/");
  });

  it.each(["/", "/settings", "/nested/path"])(
    "redirects unauthenticated access to %s",
    (pathname) => {
      expect(getAuthRedirect(pathname, false)).toBe("/login");
    },
  );

  it.each(["/", "/settings", "/nested/path"])(
    "allows authenticated access to %s",
    (pathname) => {
      expect(getAuthRedirect(pathname, true)).toBeNull();
    },
  );
});

describe("demo session constants", () => {
  it("uses stable non-empty cookie identifiers", () => {
    expect(DEMO_SESSION_COOKIE).toBe("ai_demo_session");
    expect(DEMO_SESSION_VALUE).toBe("authenticated");
  });
});
