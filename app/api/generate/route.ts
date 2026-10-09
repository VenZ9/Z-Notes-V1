import { NextRequest, NextResponse } from "next/server";
import { generateNote } from "@/lib/notes/generate";
import { toMarkdown } from "@/lib/notes/parse";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { requireAccess } from "@/lib/guard";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const denied = requireAccess(req);
  if (denied) return denied;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const topic = String(body?.topic || "").trim();
  if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });
  if (topic.length > 2000) return NextResponse.json({ error: "topic too long (max 2000 chars)" }, { status: 400 });

  const useResearch = body?.useResearch !== false;
  const extraContext = typeof body?.extraContext === "string" ? body.extraContext : undefined;
  const temperature = typeof body?.temperature === "number" ? body.temperature : 0.2;
  const save = body?.save !== false;
  const noteId = typeof body?.noteId === "string" ? body.noteId : null;

  try {
    const out = await generateNote({ topic, extraContext, useResearch, temperature });
    const markdown = toMarkdown(out.note);

    let id = noteId || randomUUID();

    if (save) {
      if (noteId) {
        await sql`
          UPDATE notes SET title=${out.note.title}, topic=${topic}, content=${markdown},
            sources=${JSON.stringify(out.sources)}::jsonb, provider=${out.provider}, model=${out.model},
            status='ready', updated_at=now()
          WHERE id=${noteId}
        `;
      } else {
        await sql`
          INSERT INTO notes (id,title,topic,content,sources,provider,model,status)
          VALUES (${id},${out.note.title},${topic},${markdown},
                  ${JSON.stringify(out.sources)}::jsonb,${out.provider},${out.model},'ready')
        `;
      }
    }

    await sql`
      INSERT INTO history (id,kind,input,provider,ok,meta)
      VALUES (${randomUUID()},'generate',${topic},${out.provider},true,
              ${JSON.stringify({
                noteId: id,
                model: out.model,
                attempts: out.attempts,
                researchUsed: out.researchUsed,
                researchError: out.researchError ?? null,
                sourceCount: out.sources.length,
              })}::jsonb)
    `;

    return NextResponse.json({
      id,
      note: out.note,
      markdown,
      sources: out.sources,
      provider: out.provider,
      model: out.model,
      researchUsed: out.researchUsed,
      researchError: out.researchError ?? null,
      attempts: out.attempts,
    });
  } catch (e) {
    const msg = (e as Error).message || "Generation failed";
    await sql`
      INSERT INTO history (id,kind,input,ok,error,meta)
      VALUES (${randomUUID()},'generate',${topic},false,${msg},'{}'::jsonb)
    `.catch(() => {});
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
