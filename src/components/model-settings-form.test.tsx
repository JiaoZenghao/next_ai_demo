// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { testSettingsAction } from "@/app/settings/actions";
import { ModelSettingsForm } from "./model-settings-form";
import { defaultSettings, publicSettings } from "@/lib/ai/settings";
vi.mock("@/app/settings/actions", () => ({ saveSettingsAction: vi.fn(), testSettingsAction: vi.fn() }));
it("shows a masked key state and makes live configuration required", async () => {
  const user = userEvent.setup();
  render(<ModelSettingsForm initial={publicSettings({ ...defaultSettings, apiKey: "secret" })} />);
  expect(screen.getByLabelText("API Key")).toHaveValue("");
  expect(screen.getByLabelText("API Key")).toHaveAttribute("type", "password");
  expect(screen.getByLabelText("清除已保存的 API Key")).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("运行模式"), "live");
  expect(screen.getByLabelText("模型名称")).toBeRequired();
  expect(screen.getByLabelText("接口地址（Base URL）")).toBeRequired();
});

it("tests saved settings and displays the result without submitting the form", async () => {
  vi.mocked(testSettingsAction).mockResolvedValue({ ok: true, message: "连接成功", durationMs: 12 });
  render(<ModelSettingsForm initial={publicSettings(defaultSettings)} />);
  await userEvent.click(screen.getByRole("button", { name: "测试连接" }));
  expect(await screen.findByText("连接成功（耗时 12 ms）")).toBeVisible();
  await userEvent.type(screen.getByLabelText("模型名称"), "changed");
  expect(screen.queryByText("连接成功（耗时 12 ms）")).not.toBeInTheDocument();
});

it("prevents testing stale saved settings while edits are pending", async () => {
  render(<ModelSettingsForm initial={publicSettings(defaultSettings)} />);
  await userEvent.selectOptions(screen.getByLabelText("运行模式"), "live");
  expect(screen.getByRole("button", { name: "测试连接" })).toBeDisabled();
  expect(screen.getByText("有未保存的修改")).toBeVisible();
});
