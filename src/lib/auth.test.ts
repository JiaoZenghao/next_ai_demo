import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import {
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_VALUE,
  getAuthRedirect,
  validateCredentials,
} from "./auth";
import { proxy } from "../proxy";

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

describe("proxy", () => {
  it("redirects an unauthenticated request to the login page", () => {
    const response = proxy(new NextRequest("http://localhost/settings"));

    expect(response.headers.get("location")).toBe("http://localhost/login");
  });

  it("allows an authenticated request through", () => {
    const request = new NextRequest("http://localhost/settings");
    request.cookies.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE);

    expect(proxy(request).headers.get("x-middleware-next")).toBe("1");
  });
});
