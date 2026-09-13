import { expect, test } from "@playwright/test";
import { createServer } from "node:http";
import { once } from "node:events";

test("protects model settings and persists edits without exposing the key", async ({ page }) => {
  const server = createServer((_request, response) => {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ id: "test", created: 0, model: "test-model", choices: [{ index: 0, message: { role: "assistant", content: "OK" }, finish_reason: "stop" }] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as { port: number };
  try {
  await page.goto("/settings");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("textbox", { name: "Username" }).fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "模型配置" }).click();
  await page.getByLabel("运行模式").selectOption("mock");
  await page.locator("summary").filter({ hasText: "模型连接" }).click();
  await page.getByLabel("接口地址（Base URL）").fill(`http://127.0.0.1:${address.port}/v1`);
  await page.getByLabel("模型名称", { exact: true }).fill("test-model");
  await page.getByLabel("API Key", { exact: true }).fill("e2e-fake-key");
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByRole("status")).toContainText("配置已保存");
  await page.getByRole("button", { name: "测试连接", exact: true }).click();
  await expect(page.getByText(/演示模式无需连接测试，不会调用真实模型/)).toBeVisible();
  await page.getByLabel("运行模式").selectOption("live");
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByRole("status")).toContainText("配置已保存");
  await page.getByRole("button", { name: "测试连接", exact: true }).click();
  await expect(page.getByText(/连接成功，模型已返回文本响应/)).toBeVisible();
  await page.getByLabel("运行模式").selectOption("mock");
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByRole("status")).toContainText("配置已保存");
  await page.reload();
  await page.locator("summary").filter({ hasText: "模型连接" }).click();
  await expect(page.getByLabel("模型名称", { exact: true })).toHaveValue("test-model");
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("");
  expect(await page.content()).not.toContain("e2e-fake-key");
  await page.getByLabel("清除已保存的 API Key").check();
  await page.getByRole("button", { name: "保存配置" }).click();
  await expect(page.getByRole("status")).toContainText("配置已保存");
  await expect(page.getByLabel("清除已保存的 API Key")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("link", { name: "返回仪表盘" }).click();
  await expect(page.getByRole("link", { name: "模型配置" }).filter({ visible: true })).toBeVisible();
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});
