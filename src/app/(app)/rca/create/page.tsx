import type { Metadata } from "next";
import { CreateRcaView } from "@/components/views/CreateRcaView";

export const metadata: Metadata = { title: "Create RCA" };

export default function Page() {
  return <CreateRcaView />;
}
