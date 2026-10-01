import type { Metadata } from "next";
import { AdminView } from "@/components/views/AdminView";

export const metadata: Metadata = { title: "Admin Settings" };

export default function Page() {
  return <AdminView />;
}
