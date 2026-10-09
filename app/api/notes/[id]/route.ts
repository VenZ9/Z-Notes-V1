import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAccess } from "@/lib/guard";
import { rowToNote } from "@/lib/notes/serialize";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAccess(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const rows = await sql`SELECT * FROM notes WHERE id = ${id}`;
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note: rowToNote(rows[0]) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAccess(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const title = body?.title != null ? String(body.title) : null;
  const content = body?.content != null ? String(body.content) : null;

  await sql`
    UPDATE notes SET
      title = COALESCE(${title}, title),
      content = COALESCE(${content}, content),
      updated_at = now()
    WHERE id = ${id}
  `;

  const rows = await sql`SELECT * FROM notes WHERE id = ${id}`;
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ note: rowToNote(rows[0]) });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAccess(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  await sql`DELETE FROM notes WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
