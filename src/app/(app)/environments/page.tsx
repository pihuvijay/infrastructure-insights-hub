import type { Metadata } from "next";
import { EnvironmentsView } from "@/components/views/EnvironmentsView";

export const metadata: Metadata = { title: "Environment Tracker" };

export default function Page() {
  return <EnvironmentsView />;
}
