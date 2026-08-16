import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth";

export type DemoSession = Readonly<{ isAuthenticated: true }>;

const DEMO_SESSION: DemoSession = Object.freeze({ isAuthenticated: true });

export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(DEMO_SESSION_COOKIE)?.value;

  return value === DEMO_SESSION_VALUE ? DEMO_SESSION : null;
}

export async function verifySession(): Promise<DemoSession> {
  const session = await getDemoSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
