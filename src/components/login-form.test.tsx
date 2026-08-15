import { renderToStaticMarkup } from "react-dom/server";
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

  it("associates both credential inputs with the login error", () => {
    useActionStateMock.mockReturnValue([
      { error: "Invalid username or password." },
      undefined,
      false,
    ]);

    const markup = renderToStaticMarkup(<LoginForm />);

    expect(markup.match(/aria-describedby="login-error"/g)).toHaveLength(2);
    expect(markup).toMatch(
      /<p[^>]*id="login-error"[^>]*role="alert"[^>]*>Invalid username or password\.<\/p>/,
    );
  });

  it("does not describe valid credential inputs with a login error", () => {
    useActionStateMock.mockReturnValue([
      { error: null },
      undefined,
      false,
    ]);

    const markup = renderToStaticMarkup(<LoginForm />);

    expect(markup).not.toContain("aria-describedby");
    expect(markup).not.toContain('id="login-error"');
  });
});
