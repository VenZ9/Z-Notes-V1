import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { requireAccess } from "@/lib/guard";
import { rowToNote } from "@/lib/notes/serialize";

export async function GET(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const rows = q
    ? await sql`
        SELECT * FROM notes
        WHERE title ILIKE ${"%" + q + "%"}
           OR topic ILIKE ${"%" + q + "%"}
           OR content ILIKE ${"%" + q + "%"}
        ORDER BY updated_at DESC LIMIT 200`
    : await sql`SELECT * FROM notes ORDER BY updated_at DESC LIMIT 200`;

  return NextResponse.json({ notes: rows.map(rowToNote) });
}

export async function POST(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const id = randomUUID();
  const title = String(body?.title || "Untitled note");
  const topic = String(body?.topic || "");
  const content = String(body?.content || "");

  await sql`
    INSERT INTO notes (id, title, topic, content, status)
    VALUES (${id}, ${title}, ${topic}, ${content}, 'draft')
  `;

  return NextResponse.json({ id });
}
