import { expect, test } from "@playwright/test";

test("protects the app and completes the demo login journey", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page).toHaveTitle("Login | AI Demo");
  await expect(
    page.getByRole("textbox", { name: "Username" }),
  ).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /google/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /forgot password/i }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /sign up/i })).toHaveCount(0);

  await page.getByRole("textbox", { name: "Username" }).fill("admin");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Invalid username or password." }),
  ).toHaveText("Invalid username or password.");

  await page.getByRole("textbox", { name: "Username" }).fill("admin");
  await page.getByLabel("Password").fill("admin123");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle("Business Overview | AI Demo");
  await expect(
    page.getByRole("heading", { name: "业务概览" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByText("$428.6K", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("application", {
      name: "Revenue from January to August 2026",
    }),
  ).toBeVisible();
  await expect(page.getByText("渠道收入")).toBeVisible();
  await page.getByRole("button", { name: "打开数据助手" }).click();
  await expect(page.getByPlaceholder("询问收入、趋势或关键指标…")).toBeVisible();
  const themeButton = page.getByRole("button", { name: "切换深浅主题" });
  await themeButton.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "打开数据助手" }).click();
  await page.getByRole("button", { name: "▶ 收入趋势流式演示", exact: true }).click();
  await expect(page.getByText("Mock 流式演示", { exact: true })).toBeVisible();
  const streamingChart = page.getByRole("region", { name: "Streaming revenue chart" });
  await expect(streamingChart.getByRole("status")).toHaveText(/正在生成图表 · [1-7] \/ 8 个月/, { timeout: 20000 });
  await page.screenshot({ path: "test-results/data-assistant-streaming.png" });
  await expect(streamingChart.getByRole("status")).toHaveText("生成完成 · 8 / 8 个月", { timeout: 20000 });
  await expect(streamingChart.getByRole("application")).toBeVisible();
  await page.screenshot({ path: "test-results/data-assistant-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByPlaceholder("询问收入、趋势或关键指标…")).toBeVisible();
  await page.screenshot({ path: "test-results/data-assistant-mobile.png" });
  await themeButton.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.screenshot({ path: "test-results/theme-light-mobile.png" });
  await page.getByRole("button", { name: "关闭数据助手", exact: true }).click();
  await expect(page.getByRole("button", { name: "打开数据助手", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "业务概览" })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: "退出登录" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
