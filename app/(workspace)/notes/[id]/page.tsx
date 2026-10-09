"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { NoteEditor } from "@/components/NoteEditor";
import { Citations } from "@/components/Citations";
import { ProviderBadge } from "@/components/ProviderBadge";
import { Spinner } from "@/components/Spinner";
import { ErrorBanner } from "@/components/ErrorBanner";
import type { NoteRecord } from "@/lib/types";

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [note, setNote] = useState<NoteRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/notes/${id}`);
    const data = await res.json();
    if (res.ok) setNote(data.note);
    else setError(data.error || "Not found");
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function save(content: string) {
    setSaving(true);
    await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSaving(false);
  }

  async function regenerate() {
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/notes/${id}/regenerate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }

  async function remove() {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    router.push("/notes");
  }

  async function copy() {
    if (!note) return;
    await navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    if (!note) return;
    const blob = new Blob([note.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${note.title.replace(/[^\w\-]+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="p-6"><Spinner label="Loading note…" /></div>;
  if (!note) return <div className="p-6 text-sm text-muted">{error || "Note not found."}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate">{note.title}</h1>
          <p className="text-sm text-muted mt-0.5">{note.topic}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProviderBadge provider={note.provider} model={note.model} />
          <button onClick={copy} className="text-xs px-2.5 py-1.5 rounded border">{copied ? "Copied" : "Copy"}</button>
          <button onClick={download} className="text-xs px-2.5 py-1.5 rounded border">Export .md</button>
          <button onClick={regenerate} disabled={busy}
            className="text-xs px-2.5 py-1.5 rounded border disabled:opacity-50">
            {busy ? "Regenerating…" : "Regenerate"}
          </button>
          <button onClick={remove} className="text-xs px-2.5 py-1.5 rounded border"
            style={{ color: "rgb(var(--danger))" }}>Delete</button>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={regenerate} /></div>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <NoteEditor value={note.content} onSave={save} saving={saving} />
        </div>
        <aside className="min-w-0">
          <Citations sources={note.sources || []} />
          {(!note.sources || note.sources.length === 0) && (
            <p className="text-sm text-muted">No sources were attached to this note. Facts could not be verified.</p>
          )}
        </aside>
      </div>
    </div>
  );
      }
