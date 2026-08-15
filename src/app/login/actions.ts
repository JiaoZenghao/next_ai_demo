"use server";

import { redirect } from "next/navigation";

import { validateCredentials } from "@/lib/auth";
import { createDemoSession } from "@/lib/session";

export type LoginState = {
  error: string | null;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (!validateCredentials(username, password)) {
    return { error: "Invalid username or password." };
  }

  await createDemoSession();
  redirect("/");
}
