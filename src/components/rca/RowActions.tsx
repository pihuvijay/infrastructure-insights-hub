import { Eye, FileEdit, Pencil } from "lucide-react";

const btn =
  "inline-flex h-7 items-center gap-1.5 rounded-md border bg-surface px-2.5 text-xs font-medium text-secondary-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function RowActions({ number, onEdit }: { number: string; onEdit: () => void }) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" onClick={stop} onKeyDown={stop}>
      <button onClick={onEdit} className={btn}>
        <Pencil className="size-3" />
        Edit RCA info
      </button>
      <a href={`/document/${number}?mode=view`} target="_blank" rel="noreferrer" className={btn}>
        <Eye className="size-3" />
        View Word
      </a>
      <a href={`/document/${number}`} target="_blank" rel="noreferrer" className={btn}>
        <FileEdit className="size-3" />
        Edit Word
      </a>
    </div>
  );
}
