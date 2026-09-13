import type { NextRequest } from "next/server";
import { getDemoSession } from "@/data/auth";
import { handleCopilotRequest } from "@/lib/copilot/runtime";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!(await getDemoSession())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleCopilotRequest(request);
}
