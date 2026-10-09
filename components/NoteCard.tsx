import Link from "next/link";
import type { NoteRecord } from "@/lib/types";

export function NoteCard({ note }: { note: NoteRecord }) {
  const preview = note.content.replace(/[#>*`\-]/g, "").slice(0, 140);
  return (
    <Link href={`/notes/${note.id}`} className="block border rounded-lg p-4 hover:bg-panel transition-colors">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium truncate">{note.title}</h3>
        <span className="text-xs text-muted whitespace-nowrap">
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-muted mt-1 line-clamp-2">{preview || note.topic}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        {note.provider && <span className="capitalize">{note.provider}</span>}
        {note.sources?.length ? <span>· {note.sources.length} sources</span> : null}
      </div>
    </Link>
  );
}
