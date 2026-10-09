export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}
