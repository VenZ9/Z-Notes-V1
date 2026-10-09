"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NoteCard } from "@/components/NoteCard";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import type { NoteRecord } from "@/lib/types";

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(query = "") {
    setLoading(true);
    const res = await fetch(`/api/notes${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    const data = await res.json();
    setNotes(data.notes || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-lg font-semibold">Notes</h1>
        <button
          onClick={() => router.push("/notes/new")}
          className="text-sm px-3 py-1.5 rounded border bg-panel hover:bg-bg"
        >
          New note
        </button>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && load(q)}
        placeholder="Search notes…"
        className="w-full mb-4 px-3 py-2 rounded border bg-panel text-sm outline-none focus:border-accent"
      />

      {loading ? (
        <Spinner label="Loading notes…" />
      ) : notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          body="Generate your first set of notes from a topic or question."
          action={
            <button onClick={() => router.push("/notes/new")}
              className="text-sm px-3 py-1.5 rounded border">Create a note</button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {notes.map((n) => <NoteCard key={n.id} note={n} />)}
        </div>
      )}
    </div>
  );
}
