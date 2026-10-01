import type { Metadata } from "next";
import { ReleaseTicketsView } from "@/components/views/ReleaseTicketsView";

export const metadata: Metadata = { title: "Release Tickets" };

export default async function Page({ params }: { params: Promise<{ env: string }> }) {
  const { env } = await params;
  return <ReleaseTicketsView env={env} />;
}
