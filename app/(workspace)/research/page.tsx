"use client";
import { useState } from "react";
import { SourceList } from "@/components/SourceList";
import { Spinner } from "@/components/Spinner";
import { ErrorBanner } from "@/components/ErrorBanner";
import { EmptyState } from "@/components/EmptyState";
import type { Source } from "@/lib/types";

export default function ResearchPage() {
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  async function run() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setSources([]);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSources(data.sources || []);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); setRan(true); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-5">Research</h1>
      <div className="flex gap-2 mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Search reliable sources…"
          className="flex-1 px-3 py-2 rounded border bg-panel text-sm outline-none focus:border-accent"
        />
        <button onClick={run} disabled={loading}
          className="text-sm px-3 py-2 rounded border disabled:opacity-50">
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {loading && <Spinner label="Searching real sources…" />}
      {error && <ErrorBanner message={error} onRetry={run} />}
      {!loading && !error && ran && sources.length === 0 && (
        <EmptyState title="No results" body="Tavily returned no usable sources for that query." />
      )}
      {sources.length > 0 && <SourceList sources={sources} />}
    </div>
  );
}
