import type { Source } from "@/lib/types";

export function SourceList({ sources, onInsert }: { sources: Source[]; onInsert?: (s: Source) => void }) {
  if (!sources.length) return null;
  return (
    <ul className="space-y-2">
      {sources.map((s) => (
        <li key={s.id} className="border rounded p-3 text-sm">
          <a href={s.url} target="_blank" rel="noreferrer noopener"
             className="font-medium underline underline-offset-2 break-words">{s.title}</a>
          <div className="text-xs text-muted mt-0.5 break-all">{s.url}</div>
          {s.snippet && <p className="text-muted mt-1 line-clamp-3">{s.snippet}</p>}
          {onInsert && (
            <button onClick={() => onInsert(s)} className="mt-2 text-xs underline">Use in note</button>
          )}
        </li>
      ))}
    </ul>
  );
}
