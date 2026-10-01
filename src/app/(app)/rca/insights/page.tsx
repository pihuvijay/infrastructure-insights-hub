import type { Metadata } from "next";
import { InsightsView } from "@/components/views/InsightsView";

export const metadata: Metadata = { title: "Incident Insights" };

export default function Page() {
  return <InsightsView />;
}
