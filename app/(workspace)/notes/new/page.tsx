"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ProviderBadge } from "@/components/ProviderBadge";
import { Citations } from "@/components/Citations";
import type { Source } from "@/lib/types";

export default function NewNotePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [useResearch, setUseResearch] = useState(true);
  const [fileText, setFileText] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [researchNote, setResearchNote] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (typeof d?.settings?.defaultUseResearch === "boolean") setUseResearch(d.settings.defaultUseResearch);
    }).catch(() => {});
  }, []);

  async function upload(file: File) {
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setFileText(data.text);
      setFileName(file.name);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function generate() {
    if (!topic.trim()) { setError("Enter a topic or question first."); return; }
    setGenerating(true); setError(null); setSources([]);
    setProvider(null); setResearchNote(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          useResearch,
          extraContext: fileText || undefined,
          save: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setSources(data.sources || []);
      setProvider(data.provider || null);
      setResearchNote(data.researchError || null);
      router.push(`/notes/${data.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold mb-5">New note</h1>

      <label className="block text-sm mb-1">Topic or question</label>
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        rows={3}
        placeholder="e.g. How does the Krebs cycle produce ATP?"
        className="w-full mb-4 px-3 py-2 rounded border bg-panel text-sm outline-none focus:border-accent resize-y"
      />

      <label className="block text-sm mb-1">Study material (optional)</label>
      <input
        type="file"
        accept=".txt,.md,.csv,.json,.docx,.pdf"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        className="block w-full text-sm mb-1"
      />
      <p className="text-xs text-muted mb-4">
        {uploading ? "Extracting…" : fileName ? `Loaded: ${fileName} (${fileText.length} chars)` : "txt, md, csv, json, docx, pdf — max 5 MB"}
      </p>

      <label className="flex items-center gap-2 text-sm mb-5">
        <input type="checkbox" checked={useResearch} onChange={(e) => setUseResearch(e.target.checked)} />
        Research with real web search (Tavily)
      </label>

      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={generate}
          disabled={generating}
          className="text-sm px-4 py-2 rounded border bg-panel hover:bg-bg disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate notes"}
        </button>
        {generating && <Spinner />}
        {provider && <ProviderBadge provider={provider} />}
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={generate} /></div>}
      {researchNote && (
        <div className="mb-4 text-sm border rounded p-3 text-muted">{researchNote}</div>
      )}
      {sources.length > 0 && <Citations sources={sources} />}
    </div>
  );
}
