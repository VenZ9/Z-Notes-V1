"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/Spinner";
import { ProviderBadge } from "@/components/ProviderBadge";

type ProviderStatus = { id: string; configured: boolean; model: string };

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [priority, setPriority] = useState<string[]>([]);
  const [research, setResearch] = useState<{ configured: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/providers/health").then((r) => r.json()),
    ]).then(([s, h]) => {
      setSettings(s.settings);
      setProviders(h.providers || []);
      setPriority(h.priority || []);
      setResearch(h.research || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function update(patch: any) {
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSettings(data.settings);
    setSaving(false);
  }

  if (loading) return <div className="p-6"><Spinner label="Loading settings…" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-lg font-semibold">Settings</h1>

      <section>
        <h2 className="text-sm font-medium mb-2">Providers</h2>
        <p className="text-xs text-muted mb-3">
          Failover order: {priority.join(" → ")}. Keys are read server-side only.
        </p>
        <ul className="border rounded-lg divide-y">
          {providers.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="capitalize font-medium">{p.id}</span>
                <span className="text-xs text-muted font-mono">{p.model}</span>
              </div>
              <span className="text-xs" style={{ color: p.configured ? "rgb(var(--muted))" : "rgb(var(--danger))" }}>
                {p.configured ? "configured" : "missing key"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Research</h2>
        <div className="border rounded-lg p-3 text-sm flex items-center justify-between">
          <span>Tavily web search</span>
          <span className="text-xs" style={{ color: research?.configured ? "rgb(var(--muted))" : "rgb(var(--danger))" }}>
            {research?.configured ? "configured" : "missing TAVILY_API_KEY"}
          </span>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Generation defaults</h2>
        <div className="space-y-3 border rounded-lg p-3">
          <label className="flex items-center justify-between text-sm">
            <span>Research by default</span>
            <input
              type="checkbox"
              checked={!!settings?.defaultUseResearch}
              onChange={(e) => update({ defaultUseResearch: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Temperature</span>
            <input
              type="number" min={0} max={2} step={0.1}
              value={settings?.defaultTemperature ?? 0.2}
              onChange={(e) => update({ defaultTemperature: Number(e.target.value) })}
              className="w-20 px-2 py-1 rounded border bg-panel text-sm"
            />
          </label>
          {saving && <p className="text-xs text-muted">Saving…</p>}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium mb-2">Environment</h2>
        <pre className="border rounded-lg p-3 text-xs font-mono overflow-x-auto">
{`GROQ_API_KEY      ${providers.find(p => p.id === "groq")?.configured ? "set" : "unset"}
GEMINI_API_KEY    ${providers.find(p => p.id === "gemini")?.configured ? "set" : "unset"}
KILO_API_KEY      ${providers.find(p => p.id === "kilo")?.configured ? "set" : "unset"}
TAVILY_API_KEY    ${research?.configured ? "set" : "unset"}
DATABASE_URL      ${"set"}`}
        </pre>
      </section>
    </div>
  );
}
