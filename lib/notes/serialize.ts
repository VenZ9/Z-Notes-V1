export function rowToNote(r: any) {
  return {
    id: r.id,
    title: r.title,
    topic: r.topic,
    content: r.content,
    sources: r.sources ?? [],
    provider: r.provider,
    model: r.model,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
