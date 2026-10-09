export function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="border border-dashed rounded-lg p-8 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted mt-1">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
