import type { Metadata } from "next";
import { BuildReleaseView } from "@/components/views/BuildReleaseView";

export const metadata: Metadata = { title: "Build Release Progress" };

export default function Page() {
  return <BuildReleaseView />;
}
