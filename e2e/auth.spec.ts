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
  await expect(page).toHaveTitle("AI Demo");
  await expect(
    page.getByRole("heading", { name: "AI Demo" }),
  ).toBeVisible();

  await page.goto("/login");
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
