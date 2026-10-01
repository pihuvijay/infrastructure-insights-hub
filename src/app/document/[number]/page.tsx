import type { Metadata } from "next";
import { DocumentEditorView } from "@/components/views/DocumentEditorView";

export const metadata: Metadata = { title: "RCA Document" };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { number } = await params;
  const { mode } = await searchParams;
  return <DocumentEditorView number={number} readOnly={mode === "view"} />;
}
