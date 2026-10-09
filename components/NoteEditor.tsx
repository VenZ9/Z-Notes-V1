"use client";
import { useEffect, useRef, useState } from "react";

export function NoteEditor({
  value, onSave, saving,
}: { value: string; onSave: (next: string) => Promise<void> | void; saving?: boolean }) {
  const [draft, setDraft] = useState(value);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setDraft(value); setDirty(false); }, [value]);

  useEffect(() => {
    if (!dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { onSave(draft); setDirty(false); }, 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [draft, dirty, onSave]);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b text-xs text-muted">
        <span>Markdown</span>
        <span>{saving ? "Saving…" : dirty ? "Unsaved" : "Saved"}</span>
      </div>
      <textarea
        value={draft}
        onChange={(e) => { setDraft(e.target.value); setDirty(true); }}
        spellCheck={false}
        className="w-full min-h-[420px] p-4 bg-transparent outline-none font-mono text-sm leading-6 resize-y"
      />
    </div>
  );
}
