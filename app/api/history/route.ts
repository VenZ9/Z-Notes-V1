import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAccess } from "@/lib/guard";

export async function GET(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;
  const rows = await sql`SELECT * FROM history ORDER BY created_at DESC LIMIT 300`;
  return NextResponse.json({
    history: rows.map((r: any) => ({
      id: r.id, kind: r.kind, input: r.input, provider: r.provider,
      ok: r.ok, error: r.error, meta: r.meta, createdAt: r.created_at,
    })),
  });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;
  await sql`DELETE FROM history`;
  return NextResponse.json({ ok: true });
}
