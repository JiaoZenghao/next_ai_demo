import { cookies } from "next/headers";

import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth";

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export async function createDemoSession(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function deleteDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
}
