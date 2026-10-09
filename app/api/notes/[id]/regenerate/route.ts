import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateNote } from "@/lib/notes/generate";
import { toMarkdown } from "@/lib/notes/parse";
import { requireAccess } from "@/lib/guard";
import { randomUUID } from "crypto";

export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const denied = requireAccess(req);
  if (denied) return denied;
  const { id } = await ctx.params;
  const rows = await sql`SELECT * FROM notes WHERE id=${id}`;
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const note = rows[0];
  const body = await req.json().catch(() => ({}));
  const useResearch = body?.useResearch !== false;
  const temperature = typeof body?.temperature === "number" ? body.temperature : 0.3;

  try {
    const out = await generateNote({ topic: note.topic, useResearch, temperature });
    const md = toMarkdown(out.note);
    await sql`
      UPDATE notes SET title=${out.note.title}, content=${md},
        sources=${JSON.stringify(out.sources)}::jsonb,
        provider=${out.provider}, model=${out.model}, status='ready', updated_at=now()
      WHERE id=${id}
    `;
    await sql`
      INSERT INTO history (id,kind,input,provider,ok,meta)
      VALUES (${randomUUID()},'regenerate',${note.topic},${out.provider},true,
              ${JSON.stringify({ noteId: id, attempts: out.attempts })}::jsonb)
    `;
    return NextResponse.json({
      note: out.note, markdown: md, sources: out.sources,
      provider: out.provider, model: out.model, attempts: out.attempts,
    });
  } catch (e) {
    const msg = (e as Error).message;
    await sql`
      INSERT INTO history (id,kind,input,ok,error,meta)
      VALUES (${randomUUID()},'regenerate',${note.topic},false,${msg},'{}'::jsonb)
    `.catch(() => {});
    return NextResponse.json({ error: msg }, { status: 502 });
  }
    }
