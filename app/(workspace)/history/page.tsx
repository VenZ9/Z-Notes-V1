"use client";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";

type H = {
  id: string; kind: string; input: string; provider: string | null;
  ok: boolean; error: string | null; createdAt: string;
};

export default function HistoryPage() {
  const [items, setItems] = useState<H[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/history");
    const data = await res.json();
    setItems(data.history || []);
    setLoading(false);
  }

  async function clearAll() {
    if (!confirm("Clear all history?")) return;
    await fetch("/api/history", { method: "DELETE" });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold">History</h1>
        {items.length > 0 && (
          <button onClick={clearAll} className="text-xs px-2.5 py-1.5 rounded border"
            style={{ color: "rgb(var(--danger))" }}>Clear</button>
        )}
      </div>

      {loading ? <Spinner label="Loading…" /> : items.length === 0 ? (
        <EmptyState title="No history" body="Generations and research queries will appear here." />
      ) : (
        <ul className="border rounded-lg divide-y">
          {items.map((h) => (
            <li key={h.id} className="p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-muted">{h.kind}</span>
                <span className="text-xs text-muted">
                  {new Date(h.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 break-words">{h.input}</p>
              <div className="mt-1 flex items-center gap-2 text-xs">
                {h.provider && <span className="capitalize text-muted">{h.provider}</span>}
                <span style={{ color: h.ok ? "rgb(var(--muted))" : "rgb(var(--danger))" }}>
                  {h.ok ? "ok" : "failed"}
                </span>
              </div>
              {h.error && <p className="text-xs mt-1" style={{ color: "rgb(var(--danger))" }}>{h.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
