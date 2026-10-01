"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bold,
  ExternalLink,
  FileEdit,
  FileDown,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Redo2,
  RotateCcw,
  Save,
  Table2,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { api } from "@/lib/api";
import type { RcaReport } from "@/lib/types";
import { htmlToDocx } from "@/lib/rca-docx";
import { reportToHtml } from "@/lib/rca-html";
import { cn } from "@/lib/utils";

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-surface hover:text-foreground disabled:opacity-40",
        active && "bg-primary-soft text-primary",
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const style = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : "0";
  const setStyle = (v: string) => {
    const c = editor.chain().focus();
    if (v === "0") c.setParagraph().run();
    else c.toggleHeading({ level: Number(v) as 1 | 2 }).run();
  };
  return (
    <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Formatting">
      <Tool
        label="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo2 className="size-4" />
      </Tool>
      <Tool
        label="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo2 className="size-4" />
      </Tool>
      <span className="mx-1.5 h-5 w-px bg-border" />
      <select
        value={style}
        onChange={(e) => setStyle(e.target.value)}
        aria-label="Paragraph style"
        className="h-8 rounded-md border bg-surface px-2 text-xs"
      >
        <option value="0">Normal</option>
        <option value="1">Title</option>
        <option value="2">Heading</option>
      </select>
      <span className="mx-1.5 h-5 w-px bg-border" />
      <Tool
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </Tool>
      <Tool
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </Tool>
      <Tool
        label="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4" />
      </Tool>
      <span className="mx-1.5 h-5 w-px bg-border" />
      <Tool
        label="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </Tool>
      <Tool
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </Tool>
      <span className="mx-1.5 h-5 w-px bg-border" />
      <Tool
        label="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <Table2 className="size-4" />
      </Tool>
      {editor.isActive("table") && (
        <>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="btn-ghost"
          >
            + Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="btn-ghost ml-1"
          >
            + Column
          </button>
          <Tool label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
            <Trash2 className="size-4" />
          </Tool>
        </>
      )}
    </div>
  );
}

export function DocumentEditorView({
  number,
  readOnly = false,
}: {
  number: string;
  readOnly?: boolean;
}) {
  const qc = useQueryClient();
  const report = useQuery({ queryKey: ["report", number], queryFn: () => api.getReport(number) });
  const incident = useQuery({
    queryKey: ["snow", number],
    queryFn: () => api.snowIncident(number),
  });
  const [dirty, setDirty] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit,
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ allowBase64: true }),
    ],
    content: "",
    editorProps: {
      attributes: { class: "doc-editor focus:outline-none", "aria-label": "RCA document" },
    },
    onUpdate: () => setDirty(true),
  });

  useEffect(() => {
    if (!editor || !report.data) return;
    editor.commands.setContent(report.data.documentHtml ?? reportToHtml(report.data));
    setDirty(false);
  }, [editor, report.data]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const current = () => ({ ...report.data!, documentHtml: editor!.getHTML() });
  const done = (msg: string) => {
    setDirty(false);
    qc.invalidateQueries({ queryKey: ["snow"] });
    toast.success(msg);
  };
  const fail = (e: unknown) => toast.error((e as Error).message);

  const save = useMutation({
    mutationFn: async () => {
      const r = current();
      await api.saveReport(r);
      qc.setQueryData(["report", number], r);
    },
    onSuccess: () => done("Document saved"),
    onError: fail,
  });
  const publish = useMutation({
    mutationFn: async () => {
      const r = current();
      const res = await api.publishReport(r, await htmlToDocx(r.documentHtml));
      qc.setQueryData(["report", number], r);
      return res;
    },
    onSuccess: (res) => {
      done(`${res.fileName} uploaded to Box`);
      qc.invalidateQueries({ queryKey: ["snow", number] });
    },
    onError: fail,
  });
  const openWord = useMutation({
    mutationFn: () => api.wordOnlineUrl(number),
    onSuccess: (url) => window.open(url, "_blank", "noopener"),
    onError: fail,
  });
  const reset = useMutation({
    mutationFn: async () => {
      const r = { ...report.data! };
      delete r.documentHtml;
      await api.saveReport(r as RcaReport);
      return r;
    },
    onSuccess: (r) => {
      qc.setQueryData(["report", number], r);
      toast.success("Reset to the form version");
    },
    onError: fail,
  });

  const download = async () => {
    const blob = await htmlToDocx(editor!.getHTML());
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `RCA-${number}.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const draft = useMutation({
    mutationFn: () => api.draftReport(number),
    onSuccess: (r) => qc.setQueryData(["report", number], r),
    onError: fail,
  });
  const needsDraft = !report.isLoading && report.data === null;
  useEffect(() => {
    if (needsDraft && !draft.isPending && !draft.isSuccess) draft.mutate();
  }, [needsDraft, draft]);

  if (report.isLoading || !report.data)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    );
  const busy = save.isPending || publish.isPending || reset.isPending;
  const published = incident.data?.rcaStatus === "published";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-sidebar/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5">
          <Link href="/rca/create" className="btn-ghost" aria-label="Back to Create RCA">
            <ArrowLeft className="size-3.5" />
            Create RCA
          </Link>
          <div className="leading-tight">
            <div className="text-sm font-medium">RCA-{number}.docx</div>
            <div className="text-[11px] text-muted-foreground">
              {readOnly ? "View only" : dirty ? "Unsaved changes" : "All changes saved"}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!readOnly && report.data.documentHtml && (
              <button
                onClick={() => {
                  if (confirm("Discard document edits and go back to the form version?"))
                    reset.mutate();
                }}
                disabled={busy}
                className="btn-ghost disabled:opacity-50"
              >
                <RotateCcw className="size-3.5" />
                Reset to form
              </button>
            )}
            {!readOnly && (
              <button
                onClick={() => save.mutate()}
                disabled={busy || !editor}
                className="btn-ghost disabled:opacity-50"
              >
                {save.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                Save
              </button>
            )}
            {readOnly && (
              <Link href={`/document/${number}`} className="btn-primary h-8">
                <FileEdit className="size-4" />
                Edit Word
              </Link>
            )}
            <button onClick={download} disabled={!editor} className="btn-ghost">
              <FileDown className="size-3.5" />
              Download .docx
            </button>
            <button
              onClick={() => openWord.mutate()}
              disabled={!published || openWord.isPending}
              title={published ? "Open in Word Online via Box" : "Upload to Box first"}
              className="btn-ghost disabled:opacity-50"
            >
              <ExternalLink className="size-3.5" />
              Open in Word Online
            </button>
            {!readOnly && (
              <button
                onClick={() => publish.mutate()}
                disabled={busy || !editor}
                className="btn-primary h-8 disabled:opacity-50"
              >
                {publish.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UploadCloud className="size-4" />
                )}
                Upload to Box
              </button>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="border-t px-4 py-1.5">{editor && <Toolbar editor={editor} />}</div>
        )}
      </header>
      <main className="px-4 py-8">
        <article className="mx-auto min-h-[1100px] max-w-[820px] rounded-md bg-paper px-14 py-12 text-paper-foreground shadow-2xl">
          <EditorContent editor={editor} />
        </article>
      </main>
    </div>
  );
}
