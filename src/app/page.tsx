import type { Metadata } from "next";

import { BusinessDashboard } from "@/components/dashboard/business-dashboard";
import { DataAssistant } from "@/components/dashboard/data-assistant";
import { verifySession } from "@/data/auth";
import { loadAIConfig } from "@/lib/ai/load-config";

export const metadata: Metadata = {
  title: { absolute: "Business Overview | AI Demo" },
  description: "A business intelligence overview with mock performance data.",
};

export default async function Home() {
  await verifySession();

  return <DataAssistant mode={loadAIConfig().mode}><BusinessDashboard /></DataAssistant>;
}
