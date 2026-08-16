// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useActionStateMock = vi.hoisted(() => vi.fn());

vi.mock("react", async () => {
  const react = await vi.importActual<typeof import("react")>("react");

  return {
    ...react,
    useActionState: useActionStateMock,
  };
});

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    useActionStateMock.mockReset();
  });

  it("renders accessible required credential fields and an enabled login action", () => {
    useActionStateMock.mockReturnValue([{ error: null }, vi.fn(), false]);

    render(<LoginForm />);

    expect(screen.getByRole("textbox", { name: "Username" })).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
    expect(
      screen.getByRole("textbox", { name: "Username" }),
    ).not.toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText("Password")).not.toHaveAttribute(
      "aria-describedby",
    );
    expect(screen.getByRole("button", { name: "Login" })).toBeEnabled();
    expect(
      screen.queryByText(/google|forgot password|sign up/i),
    ).not.toBeInTheDocument();
  });

  it("submits the credentials entered by the user", async () => {
    const user = userEvent.setup();
    const formAction = vi.fn();
    useActionStateMock.mockReturnValue([{ error: null }, formAction, false]);

    render(<LoginForm />);

    await user.type(
      screen.getByRole("textbox", { name: "Username" }),
      "admin",
    );
    await user.type(screen.getByLabelText("Password"), "admin123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(formAction).toHaveBeenCalledOnce());
    const submittedData = formAction.mock.calls[0]?.[0];

    expect(submittedData).toBeInstanceOf(FormData);
    expect((submittedData as FormData).get("username")).toBe("admin");
    expect((submittedData as FormData).get("password")).toBe("admin123");
  });

  it("describes both credential fields when login fails", () => {
    useActionStateMock.mockReturnValue([
      { error: "Invalid username or password." },
      vi.fn(),
      false,
    ]);

    render(<LoginForm />);

    expect(screen.getByRole("textbox", { name: "Username" })).toHaveAttribute(
      "aria-describedby",
      "login-error",
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-describedby",
      "login-error",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Invalid username or password.",
    );
  });

  it("disables the login action while the login request is pending", () => {
    useActionStateMock.mockReturnValue([{ error: null }, vi.fn(), true]);

    render(<LoginForm />);

    expect(
      screen.getByRole("button", { name: "Signing in..." }),
    ).toBeDisabled();
  });
});
