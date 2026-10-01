import type { Metadata } from "next";
import { HomeView } from "@/components/views/HomeView";

export const metadata: Metadata = { title: "Homepage" };

export default function Page() {
  return <HomeView />;
}
