"use client";
import type { Source } from "@/lib/types";

export function Citations({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <section className="border rounded-lg p-4">
      <h3 className="font-medium mb-3">Sources</h3>
      <ol className="space-y-3">
        {sources.map((s) => (
          <li key={s.id} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="text-muted shrink-0">[{s.id}]</span>
              <div className="min-w-0">
                <a href={s.url} target="_blank" rel="noreferrer noopener"
                   className="underline underline-offset-2 break-words hover:opacity-80">
                  {s.title}
                </a>
                <div className="text-xs text-muted mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="break-all">{s.url}</span>
                  <span className="uppercase tracking-wide">{s.tier}</span>
                </div>
                {s.snippet && (
                  <p className="text-muted mt-1 line-clamp-3">{s.snippet}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
