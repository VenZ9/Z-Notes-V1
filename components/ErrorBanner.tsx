export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border rounded-lg p-3 text-sm" style={{ borderColor: "rgb(var(--danger))" }}>
      <div className="flex items-start justify-between gap-3">
        <p style={{ color: "rgb(var(--danger))" }}>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="underline whitespace-nowrap">Retry</button>
        )}
      </div>
    </div>
  );
}
