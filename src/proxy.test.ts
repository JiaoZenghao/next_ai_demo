import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth";
import { config, proxy } from "./proxy";

describe("proxy matcher", () => {
  it.each(["/", "/login", "/settings", "/nested/path"])(
    "matches application route %s",
    (url) => {
      expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(
        true,
      );
    },
  );

  it.each([
    "/_next/static/chunk.js",
    "/_next/image?url=%2Flogo.png&w=64&q=75",
    "/favicon.ico",
    "/logo.svg",
    "/photo.png",
    "/font.woff2",
  ])("does not match static asset %s", (url) => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(false);
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

  it("redirects an authenticated login-page request home", () => {
    const request = new NextRequest("http://localhost/login");
    request.cookies.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE);

    expect(proxy(request).headers.get("location")).toBe("http://localhost/");
  });
});
