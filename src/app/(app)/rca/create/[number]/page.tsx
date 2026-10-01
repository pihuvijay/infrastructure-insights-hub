import type { Metadata } from "next";
import { RcaEditorView } from "@/components/views/RcaEditorView";

export const metadata: Metadata = { title: "RCA Report" };

export default async function Page({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <RcaEditorView number={number} />;
}
