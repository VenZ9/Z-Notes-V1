export function ProviderBadge({ provider, model }: { provider?: string | null; model?: string | null }) {
  if (!provider) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="font-medium capitalize">{provider}</span>
      {model && <span className="text-muted">· {model}</span>}
    </span>
  );
}
