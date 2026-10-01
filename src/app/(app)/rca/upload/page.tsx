import type { Metadata } from "next";
import { UploadView } from "@/components/views/UploadView";

export const metadata: Metadata = { title: "RCA Upload" };

export default function Page() {
  return <UploadView />;
}
