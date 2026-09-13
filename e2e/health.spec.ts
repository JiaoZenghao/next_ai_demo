import { expect, test } from "@playwright/test";

test("Kubernetes probes are public JSON endpoints while the dashboard remains protected", async ({ request }) => {
  for (const endpoint of ["live", "ready"]) {
    const response = await request.get(`/api/health/${endpoint}`, { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/json");
    expect(response.headers()["cache-control"]).toBe("no-store");
  }
  const dashboard = await request.get("/", { maxRedirects: 0 });
  expect(dashboard.status()).toBe(307);
  expect(dashboard.headers().location).toContain("/login");
});
