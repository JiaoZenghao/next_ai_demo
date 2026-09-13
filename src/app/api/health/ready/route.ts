import { loadAIConfig } from "@/lib/ai/load-config";
import { resolveModelConfig } from "@/lib/ai/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    const config = loadAIConfig();
    if (config.mode === "live") resolveModelConfig(config, process.env);
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Public probe: never expose configuration, keys or provider diagnostics.
    return Response.json({ status: "not-ready" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
