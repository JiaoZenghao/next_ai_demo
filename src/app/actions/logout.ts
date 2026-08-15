"use server";

import { redirect } from "next/navigation";

import { deleteDemoSession } from "@/lib/session";

export async function logoutAction(): Promise<never> {
  await deleteDemoSession();
  redirect("/login");
}
